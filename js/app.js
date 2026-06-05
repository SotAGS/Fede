// Logica principal del cuestionario
var bancosPreguntas = [
    preguntas001_100,
    preguntas101_200,
    preguntas201_300,
    preguntas301_400,
    preguntas401_500,
    preguntas501_600,
    preguntas601_700,
    preguntas701_800,
    preguntas801_900,
    preguntas901_1000
];

var PREGUNTAS_POR_BANCO = 10;

function mezclarArray(lista){

    var copia = lista.slice();

    for(var i = copia.length - 1; i > 0; i--){

        var j = Math.floor(
            Math.random() * (i + 1)
        );

        var tmp = copia[i];
        copia[i] = copia[j];
        copia[j] = tmp;
    }

    return copia;
}

function prepararBanco(preguntas){

    return preguntas.map(function(p){

        var letras = ["A", "B", "C", "D"];

        var correctaOriginal =
            (p.correcta || "")
            .toString()
            .trim()
            .toUpperCase();

        var opcionesMezcladas =
            mezclarArray(
                letras.map(function(letra){
                    return {
                        letraOriginal: letra,
                        texto: p.opciones[letra]
                    };
                })
            );

        var nuevasOpciones = {};
        var nuevaCorrecta = "";

        opcionesMezcladas.forEach(function(op, index){

            var nuevaLetra = letras[index];

            nuevasOpciones[nuevaLetra] = op.texto;

            if(op.letraOriginal === correctaOriginal){
                nuevaCorrecta = nuevaLetra;
            }
        });

        return Object.assign({}, p, {
            opciones: nuevasOpciones,
            correcta: nuevaCorrecta || correctaOriginal
        });
    });
}

function seleccionarPorBanco(
    banco,
    cantidad,
    usadas,
    numeroBanco
){

    var seleccionadas = [];

    var bancoLimpio =
        banco.filter(function(p){
            return (
                p &&
                p.pregunta &&
                p.opciones &&
                typeof p.opciones === "object"
            );
        });

    var mezcladas =
        mezclarArray(bancoLimpio);

    for(
        var i = 0;
        i < mezcladas.length &&
        seleccionadas.length < cantidad;
        i++
    ){

        var pregunta = mezcladas[i];

        if(!pregunta){
            continue;
        }

        var clave =
            (pregunta.tema || "") + "|" +
            (pregunta.subtema || "") + "|" +
            (pregunta.pregunta || "");

        if(usadas[clave]){
            continue;
        }

        usadas[clave] = true;
        seleccionadas.push(
            Object.assign({}, pregunta, {
                _origenBanco: numeroBanco
            })
        );
    }

    // Si hubo colisiones de texto entre bancos,
    // completa con preguntas no usadas de este banco
    // para mantener el total solicitado.
    if(seleccionadas.length < cantidad){

        for(
            var j = 0;
            j < mezcladas.length &&
            seleccionadas.length < cantidad;
            j++
        ){
            if(
                mezcladas[j] &&
                seleccionadas.indexOf(
                    mezcladas[j]
                ) === -1
            ){
                seleccionadas.push(
                    Object.assign(
                        {},
                        mezcladas[j],
                        {
                            _origenBanco:
                                numeroBanco
                        }
                    )
                );
            }
        }
    }

    return seleccionadas;
}

function generarExamen(){

    var usadas = {};

    var seleccion = [];

    bancosPreguntas.forEach(
        function(banco, index){

            seleccion = seleccion.concat(
                seleccionarPorBanco(
                    banco,
                    PREGUNTAS_POR_BANCO,
                    usadas,
                    index + 1
                )
            );
        }
    );

    return prepararBanco(
        mezclarArray(seleccion)
    );
}

var bancoPreguntas =
    generarExamen();

var indice = 0;
var correctas = 0;
var respondida = false;

var tema = document.getElementById("tema");
var pregunta = document.getElementById("pregunta");
var opciones = document.getElementById("opciones");
var feedback = document.getElementById("feedback");

var numeroPregunta = document.getElementById("numeroPregunta");
var totalPreguntas = document.getElementById("totalPreguntas");
var correctasHTML = document.getElementById("correctas");
var toggleTema = document.getElementById("toggleTema");

function aplicarTema(esOscuro){

    document.body.classList.toggle(
        "dark",
        esOscuro
    );

    if(toggleTema){
        toggleTema.checked = esOscuro;
    }
}

function inicializarTema(){

    var guardado = localStorage.getItem(
        "modoOscuro"
    );

    aplicarTema(guardado === "1");

    if(toggleTema){
        toggleTema.addEventListener(
            "change",
            function(){
                var activo = toggleTema.checked;
                aplicarTema(activo);
                localStorage.setItem(
                    "modoOscuro",
                    activo ? "1" : "0"
                );
            }
        );
    }
}

totalPreguntas.textContent = bancoPreguntas.length;

function construirFeedback(p, encabezado){

    var lineas = [encabezado];

    if(p.explicacion){
        lineas.push(
            "Explicacion: " +
            p.explicacion
        );
    }

    if(
        Array.isArray(p.bibliografia) &&
        p.bibliografia.length > 0
    ){
        lineas.push(
            "Bibliografia: " +
            p.bibliografia.join(" | ")
        );
    }

    return lineas.join("\n");
}

function cargarPregunta(){

    respondida = false;

    feedback.textContent = "";

    var p = bancoPreguntas[indice];

    numeroPregunta.textContent = indice + 1;

    tema.textContent =
        p.tema + " - " +
        p.subtema;

    pregunta.textContent =
        p.pregunta;

    opciones.innerHTML = "";

    ["A","B","C","D"].forEach(function(letra){

        var div =
            document.createElement("div");

        div.className =
            "opcion";

        div.innerHTML =
            "<strong>" +
            letra +
            ")</strong> " +
            p.opciones[letra];

        div.onclick =
            function(){

                if(respondida){
                    return;
                }

                respondida = true;

                if(letra === p.correcta){

                    div.classList.add(
                        "correcta"
                    );

                    feedback.textContent =
                        construirFeedback(
                            p,
                            "Correcto"
                        );

                    correctas++;

                    correctasHTML.textContent =
                        correctas;

                }else{

                    div.classList.add(
                        "incorrecta"
                    );

                    var textoCorrecta =
                        p.opciones[p.correcta]
                        ? " (" +
                          p.opciones[p.correcta] +
                          ")"
                        : "";

                    feedback.textContent =
                        construirFeedback(
                            p,
                            "Incorrecto. Respuesta correcta: " +
                            p.correcta +
                            textoCorrecta
                        );

                    mostrarCorrecta(
                        p.correcta
                    );
                }
            };

        opciones.appendChild(div);

    });

}

function mostrarCorrecta(correcta){

    var lista =
        document.querySelectorAll(
            ".opcion"
        );

    lista.forEach(function(op){

        if(
            op.innerText.startsWith(
                correcta
            )
        ){
            op.classList.add(
                "correcta"
            );
        }

    });

}

document
.getElementById(
    "btnSiguiente"
)
.addEventListener(
    "click",
    function(){

        indice++;

        if(
            indice >=
            bancoPreguntas.length
        ){

            alert(
                "Examen finalizado.\n\n" +
                "Correctas: " +
                correctas +
                "/" +
                bancoPreguntas.length
            );

            indice = 0;

            correctas = 0;

            correctasHTML.textContent =
                0;

            bancoPreguntas =
                generarExamen();

            totalPreguntas.textContent =
                bancoPreguntas.length;
        }

        cargarPregunta();

    }
);

cargarPregunta();
inicializarTema();