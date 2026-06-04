from flask import Flask, render_template, request, jsonify
from services.search_service import trova_top3_categorie, trova_categoria

app = Flask(__name__)

# Precarica cache all'avvio
from services.search_service import carica_dati
carica_dati()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    queries = data.get('queries', [])
    risultati = trova_top3_categorie(queries)
    if risultati:
        return jsonify({'success': True, 'risultati': risultati})
    return jsonify({'success': False})

@app.route('/risultati')
def risultati():
    return render_template('risultati.html')

@app.route('/api/categorie')
def api_categorie():
    from services.search_service import carica_dati
    import json
    _, categorie = carica_dati()
    return json.dumps(categorie), 200, {'Content-Type': 'application/json'}

@app.route('/test')
def test():
    return render_template('test.html')

@app.route('/categoria/<categoria>')
def categoria(categoria):
    return render_template(f'categorie/{categoria}.html')

if __name__ == '__main__':
    app.run(debug=True)
