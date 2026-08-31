module.exports = [
  {
    "type": "heading",
    "defaultValue": "Tandoor Shopping Settings"
  },
  {
    "type": "text",
    "defaultValue": "Enter your Tandoor Recipes server details."
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "Server"
      },
      {
        "type": "input",
        "messageKey": "baseUrl",
        "defaultValue": "",
        "label": "Tandoor Base URL",
        "attributes": {
          "placeholder": "https://tandoor.example.com",
          "type": "url"
        }
      },
      {
        "type": "input",
        "messageKey": "apiToken",
        "defaultValue": "",
        "label": "API Token",
        "attributes": {
          "placeholder": "Paste token here",
          "type": "text"
        }
      }
    ]
  },
  {
    "type": "submit",
    "defaultValue": "Save Settings"
  }
];

