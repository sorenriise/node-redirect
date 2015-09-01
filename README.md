# node-redirect

Creates a server which redirects incoming traffic to another domain and tracks all the requests.

This server alloows for a high voloume of redirect code where redirect codes are created programatically.


# Requirements

- node
- npm
- mongodb

# Installation

```
    npm install shortcode-redirect
```
You will need to have MongoDb installed as well; shortcodes database is serverd from mongodb


# Configuration

In order to run the `redirect` application, you will need to modify the `config.json` with your redirection options.


```js
{
  "port": 80,
  "redirects": {
    "localhost": {
      "code": 302,
      "lookup": true,
      "insert": {
        "sharedsalt": "my secret salt",
	"url": "/newshortcode"
      }			
    },
    "otherhost.com": {
      "host": "http://shopping.example.com",
      "keepurl": true
      "code": 302,
    },
    "*": {
      "host": "http://www.google.com",
      "code": 302
    }
  }
}
```

The "*" config is the catch all, every host not specified in the config will be redirected there.

The "localhost" entry has two variants;

Varient 1 -- This will take the shortcode from the url and redirect to a personalized url.

- lookup: true/false, translated the short code to a destination url.
- insert: allow the domain to be used for creating new shortcodes remotely.  See example.py how to create and post new shortcodes.
    - sharedsalt: seret used to sign requests.
    - url: the url used for the post operation
- code: the http code used for redirecting traffic.

Vatriant 2 -- A static mapping of one domain to another (i.e. no short codes, but just redirect)

- host: The destination URL
- keepurl: true/false, retrain the url part of the request, i.e. example.com/abc -> google.com/abc


# Usage

### Starting locally

    node bin/server

Create an example shortcode;

    python ./example.py


*Now you can visit http://localhost/... to be redirected*

Or specify a custom port on wich to run the server:

    node bin/server --port=3000

