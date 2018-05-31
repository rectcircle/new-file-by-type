module.exports = [{
        "category": "Java",
        "name": "Properties",
        "defaultFilename": "application",
        "defaultSrc": "src/main/resource",
        "suffix": "properties",
        "body": ["#properties file", "$0"]
    },
    {
        "name": "Bash",
        "defaultFilename": "run",
        "defaultSrc": "",
        "suffix": "sh",
        "body": ["#!/bin/bash", "$0"]
    },
    {
        "category": "Web",
        "name": "JS",
        "defaultFilename": "main",
        "defaultSrc": "js",
        "suffix": "js",
        "body": [
            "$(function() {",
            "  $0",
            "})"
        ]
    },
    {
        "category": "Web",
        "name": "CSS",
        "defaultFilename": "style",
        "defaultSrc": "css",
        "suffix": "css",
        "body": ["$0"]
    }
]