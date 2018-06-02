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
        "name": "VUE COMPONENT",
        "defaultFilename": "component",
        "defaultSrc": "src/components",
        "suffix": "vue",
        "body": [
            "<template>",
            "$0",
            "</template>",
            "",
            "<script>",
            "</script>",
            "",
            "<style>",
            "</style>",
        ]
    },
    {
        "category": "Web",
        "name": "CSS",
        "defaultFilename": "style",
        "defaultSrc": "css",
        "suffix": "css",
        "body": ["$0"]
    },
    {
        "category": "Web",
        "name": "Sass",
        "defaultFilename": "style",
        "defaultSrc": "sass",
        "suffix": "sass",
        "body": ["$0"]
    },
    {
        "category": "Web",
        "name": "Less",
        "defaultFilename": "style",
        "defaultSrc": "less",
        "suffix": "less",
        "body": ["$0"]
    }

]