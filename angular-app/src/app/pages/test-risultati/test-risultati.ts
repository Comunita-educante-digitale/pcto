import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Attivita, Categoria, DataService, Raccomandazione, Regola, normalizeText } from '../../services/data.service';

interface RegolaPatto {
  nome: string;
  dati: Regola;
  attivita: Attivita[];
}

interface CategoriaPatto {
  id: string;
  info: Categoria | { id: string; nome: string; descrizione: string };
  regole: RegolaPatto[];
}

type RGB = [number, number, number];

@Component({
  selector: 'app-test-risultati',
  imports: [RouterLink],
  templateUrl: './test-risultati.html'
})
export class TestRisultati implements OnInit {
  private data = inject(DataService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  errore = signal(false);
  patto = signal<CategoriaPatto[]>([]);
  pdfAbilitato = signal(false);

  rifaiQueryParams: Record<string, string> = {};

  private pattoOriginale: CategoriaPatto[] = [];
  private tutteLeRegoleDB: Record<string, Regola> = {};
  private tutteLeRaccomandazioniDB: Record<string, Raccomandazione> = {};

  ngOnInit(): void {
    const cat = this.route.snapshot.queryParamMap.get('categorie');
    if (cat) this.rifaiQueryParams = { categorie: cat };
    this.carica();
  }

  conteggioAttivita(categoria: CategoriaPatto): number {
    return categoria.regole.reduce((tot, r) => tot + (r.attivita?.length || 0), 0);
  }

  private async carica(): Promise<void> {
    try {
      const raw = this.route.snapshot.queryParamMap.get('regole');
      if (!raw) throw new Error('Parametro regole mancante');
      const nomiRegole: string[] = JSON.parse(raw);
      const rawCategorie = this.route.snapshot.queryParamMap.get('categorie');
      const categorieSelezionate: string[] = rawCategorie ? JSON.parse(rawCategorie) : [];

      const data = await this.data.getTestIniziale();
      const regoleDb = data.regole || {};
      this.tutteLeRegoleDB = regoleDb;
      const appDataCompleto = await this.data.getAppData();
      this.tutteLeRaccomandazioniDB = appDataCompleto.data.recommendations || {};
      const attivitaDb = await this.data.getAttivita();
      const attivitaArray = Object.values(attivitaDb || {});
      const categorieDb = await this.data.getCategorie();

      const categoriePerRegola: Record<string, string[]> = {};
      const unici = [...new Set(nomiRegole.filter(Boolean))];
      unici.forEach(nome => {
        const regola = regoleDb[nome] || ({} as Regola);
        const categorieIds = Array.isArray(regola.categorie) ? regola.categorie : [];
        categorieIds.forEach(id => {
          if (!categoriePerRegola[id]) categoriePerRegola[id] = [];
          categoriePerRegola[id].push(nome);
        });
      });

      const categorieIdsOrdine: string[] = [];
      categorieSelezionate.forEach(id => {
        if (id && !categorieIdsOrdine.includes(id)) categorieIdsOrdine.push(id);
      });
      Object.keys(categoriePerRegola).forEach(id => {
        if (!categorieIdsOrdine.includes(id)) categorieIdsOrdine.push(id);
      });

      const struttura: CategoriaPatto[] = categorieIdsOrdine.map(id => {
        const info = categorieDb[id] || Object.values(categorieDb).find(item =>
          normalizeText(item.id) === normalizeText(id) || normalizeText(item.categoria) === normalizeText(id)
        ) || { id, nome: id, descrizione: '' };
        const regolePerCategoria: RegolaPatto[] = [];
        const regoleNellaCategoria = categoriePerRegola[id] || [];
        regoleNellaCategoria.forEach(nomeRegola => {
          const regola = regoleDb[nomeRegola] || ({} as Regola);
          const attivitaRegola = attivitaArray.filter(att => normalizeText(att.regola) === normalizeText(nomeRegola));
          regolePerCategoria.push({ nome: nomeRegola, dati: regola, attivita: attivitaRegola });
        });
        return { id, info, regole: regolePerCategoria };
      });

      this.pattoOriginale = JSON.parse(JSON.stringify(struttura));
      this.patto.set(struttura);
      this.pdfAbilitato.set(struttura.length > 0);
      this.loading.set(false);
    } catch (e) {
      this.errore.set(true);
      this.loading.set(false);
    }
  }

  eliminaRegola(categoriaIndex: number, regolaIndex: number): void {
    this.patto.update(patto => {
      const copia = [...patto];
      if (!copia[categoriaIndex]) return patto;
      const categoria = { ...copia[categoriaIndex], regole: [...copia[categoriaIndex].regole] };
      categoria.regole.splice(regolaIndex, 1);
      if (categoria.regole.length === 0) copia.splice(categoriaIndex, 1);
      else copia[categoriaIndex] = categoria;
      return copia;
    });
    this.pdfAbilitato.set(this.patto().length > 0);
  }

  eliminaAttivita(categoriaIndex: number, regolaIndex: number, attivitaIndex: number): void {
    this.patto.update(patto => {
      const copia = [...patto];
      const categoria = copia[categoriaIndex];
      if (!categoria || !categoria.regole[regolaIndex]) return patto;
      const regole = [...categoria.regole];
      const regola = { ...regole[regolaIndex], attivita: [...regole[regolaIndex].attivita] };
      regola.attivita.splice(attivitaIndex, 1);
      regole[regolaIndex] = regola;
      copia[categoriaIndex] = { ...categoria, regole };
      return copia;
    });
  }

  downloadPDF(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pattoStruttura = this.patto();
    const pattoOriginale = this.pattoOriginale;

    const VERDE: RGB = [22, 120, 80];
    const VERDE_CHIARO: RGB = [210, 240, 225];
    const GIALLO: RGB = [230, 170, 0];
    const GIALLO_CHIARO: RGB = [255, 245, 200];
    const BLU: RGB = [30, 90, 160];
    const BLU_CHIARO: RGB = [215, 230, 250];
    const BIANCO: RGB = [255, 255, 255];
    const NERO: RGB = [25, 25, 25];
    const GRIGIO: RGB = [90, 90, 90];
    const ROSA: RGB = [230, 150, 180];
    const ROSA_CHIARO: RGB = [255, 240, 245];
    const ROSSO: RGB = [220, 80, 40];

    const pageNum = () => doc.getNumberOfPages();

    function sfondoRighe(colore: RGB, x: number, y: number, w: number, h: number): void {
      doc.setFillColor(...colore);
      doc.roundedRect(x, y, w, h, 4, 4, 'F');
    }

    // =====================
    // PARTE 1 — POSTER REGOLE SCELTE
    // =====================
    doc.setFillColor(...VERDE_CHIARO);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setFillColor(...VERDE);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(...BIANCO);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('LE NOSTRE REGOLE DIGITALI', 105, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Il patto che abbiamo scelto insieme per usare bene la tecnologia', 105, 31, { align: 'center' });

    const tutteLeRegole: { cat: string; nome: string; desc: string }[] = [];
    const regoleGiaViste = new Set<string>();
    pattoStruttura.forEach(categoria => {
      const catName = categoria.info.nome || categoria.id;
      categoria.regole.forEach(regola => {
        if (regoleGiaViste.has(regola.nome)) return;
        regoleGiaViste.add(regola.nome);
        tutteLeRegole.push({ cat: catName, nome: regola.nome || '', desc: regola.dati.descrizione || '' });
      });
    });

    const totRegole = tutteLeRegole.length || 1;
    const areaH = 297 - 40 - 18; // pagina meno header e footer
    const cardH = Math.min(40, Math.floor(areaH / totRegole) - 4);
    const fontSize = cardH > 28 ? 11 : cardH > 20 ? 9 : 7.5;

    let y = 46;
    tutteLeRegole.forEach((r, i) => {
      const isAlt = i % 2 === 0;
      sfondoRighe(isAlt ? BIANCO : VERDE_CHIARO, 10, y, 190, cardH);

      doc.setFillColor(...VERDE);
      doc.circle(18, y + cardH / 2, 5, 'F');
      doc.setTextColor(...BIANCO);
      doc.setFontSize(fontSize + 1);
      doc.setFont('helvetica', 'bold');
      doc.text(String(i + 1), 18, y + cardH / 2 + 1.5, { align: 'center' });

      doc.setTextColor(...VERDE);
      doc.setFontSize(fontSize - 2);
      doc.setFont('helvetica', 'bold');
      doc.text(r.cat.toUpperCase(), 27, y + 5);

      doc.setTextColor(...NERO);
      doc.setFontSize(fontSize + 1);
      doc.setFont('helvetica', 'bold');
      const nomeLines = doc.splitTextToSize(r.nome, 165);
      doc.text(nomeLines, 27, y + 10);

      if (cardH > 22) {
        doc.setTextColor(...GRIGIO);
        doc.setFontSize(fontSize - 1);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(r.desc, 165);
        doc.text(descLines, 27, y + 10 + (nomeLines.length * (fontSize + 1) * 0.4) + 4);
      }

      y += cardH + 3;
    });

    doc.setFillColor(...VERDE);
    doc.rect(0, 284, 210, 13, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BIANCO);
    doc.text('Educazione Digitale Familiare', 105, 292, { align: 'center' });

    // =====================
    // PARTE 2 — TUTTE LE REGOLE CONSIGLIATE
    // =====================
    doc.addPage();

    doc.setFillColor(...GIALLO);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(...BIANCO);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TUTTE LE REGOLE CONSIGLIATE', 105, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Queste regole sono emerse dal tuo test - puoi usarle come riferimento', 105, 24, { align: 'center' });

    const righeConsigliate: string[][] = [];
    const consigliateViste = new Set<string>();
    pattoOriginale.forEach(categoria => {
      const catName = categoria.info.nome || categoria.id;
      categoria.regole.forEach(regola => {
        if (consigliateViste.has(regola.nome)) return;
        consigliateViste.add(regola.nome);
        righeConsigliate.push([
          catName,
          regola.nome || '',
          regola.dati.descrizione || '',
          regola.dati.raccomandazione || ''
        ]);
      });
    });

    autoTable(doc, {
      startY: 38,
      head: [['Categoria', 'Regola', 'Descrizione', 'Raccomandazione']],
      body: righeConsigliate,
      theme: 'grid',
      headStyles: { fillColor: GIALLO, textColor: BIANCO, fontStyle: 'bold', fontSize: 9, halign: 'center' },
      bodyStyles: { fontSize: 8.5, textColor: NERO, valign: 'top', lineColor: [210, 195, 150], lineWidth: 0.2 },
      alternateRowStyles: { fillColor: GIALLO_CHIARO },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 68 },
        3: { cellWidth: 45 }
      },
      margin: { left: 10, right: 10, bottom: 18 },
      didDrawPage: () => {
        doc.setFillColor(...GIALLO);
        doc.rect(0, 284, 210, 13, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...BIANCO);
        doc.text('Educazione Digitale Familiare', 14, 291);
        doc.text('Pag. ' + pageNum(), 196, 291, { align: 'right' });
      }
    });

    // =====================
    // PARTE 3 — ATTIVITA
    // =====================
    doc.addPage();

    doc.setFillColor(...BLU);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(...BIANCO);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LE NOSTRE ATTIVITA', 105, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Esercizi pratici da fare insieme in famiglia', 105, 24, { align: 'center' });

    let ay = 38;

    const footerBlu = () => {
      doc.setFillColor(...BLU);
      doc.rect(0, 284, 210, 13, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...BIANCO);
      doc.text('Educazione Digitale Familiare', 14, 291);
      doc.text('Pag. ' + pageNum(), 196, 291, { align: 'right' });
    };

    pattoStruttura.forEach(categoria => {
      if (categoria.regole.length === 0) return;
      const catName = categoria.info.nome || categoria.id;

      categoria.regole.forEach(regola => {
        if (!regola.attivita || regola.attivita.length === 0) return;

        regola.attivita.forEach(att => {
          if (ay > 268) {
            footerBlu();
            doc.addPage();
            ay = 15;
          }

          const descLines = doc.splitTextToSize(att.descrizione || '', 150);
          const cardH2 = 16 + (descLines.length * 4);

          doc.setFillColor(...BLU_CHIARO);
          doc.roundedRect(10, ay, 190, cardH2, 3, 3, 'F');
          doc.setFillColor(...BLU);
          doc.roundedRect(10, ay, 190, 7, 3, 3, 'F');
          doc.rect(10, ay + 4, 190, 3, 'F');

          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...BIANCO);
          doc.text((catName + ' - ' + regola.nome).toUpperCase(), 14, ay + 5);

          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...NERO);
          doc.text(att.nome || '', 14, ay + 13);

          const info = [
            att.eta ? 'Eta: ' + att.eta : '',
            att.durata ? 'Durata: ' + att.durata : '',
            att.frequenza ? 'Frequenza: ' + att.frequenza : ''
          ].filter(Boolean).join('   ');
          if (info) {
            doc.setFontSize(7.5);
            doc.setTextColor(...BLU);
            doc.text(info, 196, ay + 13, { align: 'right' });
          }

          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...GRIGIO);
          doc.text(descLines, 14, ay + 18);

          ay += cardH2 + 5;
        });
      });
    });

    footerBlu();

    // =====================
    // PAGINA 4 — TUTTE LE RACCOMANDAZIONI (Rosa)
    // =====================
    doc.addPage();
    doc.setFillColor(...ROSA);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(...BIANCO);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TUTTE LE RACCOMANDAZIONI', 105, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Principi guida per educare i giovani alla tecnologia', 105, 24, { align: 'center' });

    const tutteRaccomandazioni: string[][] = [];
    Object.entries(this.tutteLeRaccomandazioniDB || {}).forEach(([nome, racc]) => {
      tutteRaccomandazioni.push([nome, racc.descrizione || '']);
    });

    if (tutteRaccomandazioni.length > 0) {
      autoTable(doc, {
        startY: 38,
        head: [['Raccomandazione', 'Descrizione']],
        body: tutteRaccomandazioni,
        theme: 'grid',
        headStyles: { fillColor: ROSA, textColor: BIANCO, fontStyle: 'bold', fontSize: 10, halign: 'center' },
        bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30], valign: 'top', lineColor: [240, 190, 210], lineWidth: 0.2 },
        alternateRowStyles: { fillColor: ROSA_CHIARO },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
        margin: { left: 10, right: 10, bottom: 18 },
        didDrawPage: () => {
          doc.setFillColor(...ROSA);
          doc.rect(0, 284, 210, 13, 'F');
          doc.setFontSize(8);
          doc.setTextColor(...BIANCO);
          doc.text('Educazione Digitale Familiare', 14, 291);
          doc.text('Pag. ' + pageNum(), 196, 291, { align: 'right' });
        }
      });
    }

    // =====================
    // PAGINA 5 — TUTTE LE REGOLE (Rosso)
    // =====================
    doc.addPage();
    doc.setFillColor(...ROSSO);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(...BIANCO);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TUTTE LE REGOLE', 105, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Tutte le regole presenti nel database', 105, 24, { align: 'center' });

    const tutteRegole: string[][] = [];
    Object.entries(this.tutteLeRegoleDB || {}).forEach(([nome, regola]) => {
      tutteRegole.push([nome, regola.descrizione || '']);
    });

    if (tutteRegole.length > 0) {
      autoTable(doc, {
        startY: 38,
        head: [['Regola', 'Descrizione']],
        body: tutteRegole,
        theme: 'grid',
        headStyles: { fillColor: ROSSO, textColor: BIANCO, fontStyle: 'bold', fontSize: 10, halign: 'center' },
        bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30], valign: 'top', lineColor: [240, 150, 100], lineWidth: 0.2 },
        alternateRowStyles: { fillColor: [255, 240, 220] },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
        margin: { left: 10, right: 10, bottom: 18 },
        didDrawPage: () => {
          doc.setFillColor(...ROSSO);
          doc.rect(0, 284, 210, 13, 'F');
          doc.setFontSize(8);
          doc.setTextColor(...BIANCO);
          doc.text('Educazione Digitale Familiare', 14, 291);
          doc.text('Pag. ' + pageNum(), 196, 291, { align: 'right' });
        }
      });
    }

    doc.save('patto_familiare.pdf');
  }
}
