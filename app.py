from flask import Flask, render_template, request, jsonify
from services.search_service import trova_categoria
app = Flask(__name__)



@app.route('/')
def index():
    return render_template('index.html')


@app.route("/search", methods=["POST"])
def search():

    data = request.get_json()

    query = data.get("query", "")

    categoria = trova_categoria(query)

    if categoria:

        return jsonify({
            "success": True,
            "redirect": f"/categoria/{categoria}"
        })

    return jsonify({
        "success": False
    })


@app.route("/categoria/<categoria>")
def categoria(categoria):

    return render_template(
        f"categorie/{categoria}.html"
    )


if __name__ == '__main__':
    app.run(debug=True)
