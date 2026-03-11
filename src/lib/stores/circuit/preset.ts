export const preset = {
    "numQubits": 6,
    "params": [],
    "options": {
        "params": {},
        "hybrid": false,
        "hybridOptions": {
            "optimizer": "Powell",
            "tolerance": 0.001,
            "costFunction": {
                "python": "",
                "javascript": ""
            }
        },
        "encoderDecoder": false,
        "encoderDecoderOptions": {
            "functionName": "",
            "inputEncoding": {
                "type": "custom",
                "customFunction": {
                    "python": "def custom_encoder(input_data_row, input_encoding):\n    qasm = \"\"\n    qasm += \"OPENQASM 2.0;\\n\"\n    qasm += \"include \\\"qelib1.inc\\\";\\n\"\n\n    # ...\n\n    return qasm\n",
                    "javascript": "function customEncoder(inputDataRow, inputEncoding) {\n    let qasm = \"\";\n    qasm += \"OPENQASM 2.0;\\n\";\n    qasm += \"include \\\"qelib1.inc\\\";\\n\";\n    \n    // ...\n    \n    return qasm;\n}\n"
                },
                "qubitOffset": 0,
                "colDefs": [],
                "data": []
            },
            "outputDecoding": {
                "type": "custom",
                "customFunction": {
                    "python": "def custom_decoder(counts, output_decoding):\n    output_data_row = {}\n\n    # ...\n    \n    return output_data_row\n",
                    "javascript": "function customDecoder(counts, outputDecoding) {\n    outputDataRow = {};\n    \n    // ...\n    \n    return outputDataRow;\n}\n"
                },
                "qubitOffset": 0,
                "colDefs": []
            }
        }
    },
    "gates": [
        [
            {
                "id": "hqeDBGBYrawjMQiOjP",
                "name": "rx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {
                        "theta": 0.9424777960769379
                    }
                }
            },
            {
                "id": "eDqGgJ0Tv7GG8TIp8q",
                "name": "cx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {}
                }
            },
            null,
            null,
            {
                "id": "Sc1xIXkSSFg7wmRJzP",
                "name": "crx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {
                        "theta": 0.34010505347750125
                    }
                }
            },
            {
                "id": "A0Aazm6LxJrMj0SenD",
                "name": "cx",
                "connector": 1,
                "options": {
                    "creg": {},
                    "params": {}
                }
            },
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            {
                "id": "ObGplFd6fAaaBP3zS5",
                "name": "crx",
                "connector": 1,
                "options": {
                    "creg": {},
                    "params": {
                        "theta": 2.4880838650109975
                    }
                }
            },
            {
                "id": "dhgqo6aMDT5KpxOWQR",
                "name": "cx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {}
                }
            },
            null,
            null,
            {
                "id": "BMSnnTHuoRbX7cElSQ",
                "name": "crx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {
                        "theta": 1.8122957551672516
                    }
                }
            },
            {
                "id": "ffGnwHXrWMTGF9mrS1",
                "name": "cx",
                "connector": 1,
                "options": {
                    "creg": {},
                    "params": {}
                }
            },
            null,
            null
        ],
        [
            {
                "id": "XpiYpxlunJbPE8R5UQ",
                "name": "x",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {}
                }
            },
            {
                "id": "eDqGgJ0Tv7GG8TIp8q",
                "name": "cx",
                "connector": 1,
                "options": {
                    "creg": {},
                    "params": {}
                }
            },
            {
                "id": "ObGplFd6fAaaBP3zS5",
                "name": "crx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {
                        "theta": 2.4880838650109975
                    }
                }
            },
            {
                "id": "dhgqo6aMDT5KpxOWQR",
                "name": "cx",
                "connector": 1,
                "options": {
                    "creg": {},
                    "params": {}
                }
            },
            null,
            null,
            null,
            null,
            {
                "id": "VuuqxlWEgwFrhgWzSq",
                "name": "crx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {
                        "theta": 1.5546196235588141
                    }
                }
            },
            {
                "id": "lCwAepl2L9M8tYDgLU",
                "name": "cx",
                "connector": 1,
                "options": {
                    "creg": {},
                    "params": {}
                }
            }
        ],
        [
            null,
            null,
            null,
            null,
            {
                "id": "Sc1xIXkSSFg7wmRJzP",
                "name": "crx",
                "connector": 1,
                "options": {
                    "creg": {},
                    "params": {
                        "theta": 0.34010505347750125
                    }
                }
            },
            {
                "id": "A0Aazm6LxJrMj0SenD",
                "name": "cx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {}
                }
            },
            null,
            null,
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null,
            {
                "id": "BMSnnTHuoRbX7cElSQ",
                "name": "crx",
                "connector": 1,
                "options": {
                    "creg": {},
                    "params": {
                        "theta": 1.8122957551672516
                    }
                }
            },
            {
                "id": "ffGnwHXrWMTGF9mrS1",
                "name": "cx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {}
                }
            },
            null,
            null
        ],
        [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            {
                "id": "VuuqxlWEgwFrhgWzSq",
                "name": "crx",
                "connector": 1,
                "options": {
                    "creg": {},
                    "params": {
                        "theta": 1.5546196235588141
                    }
                }
            },
            {
                "id": "lCwAepl2L9M8tYDgLU",
                "name": "cx",
                "connector": 0,
                "options": {
                    "creg": {},
                    "params": {}
                }
            }
        ]
    ],
    "customGates": {},
    "cregs": {}
}

