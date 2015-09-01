#!/bin/python

# This is an example app which post a shortcode and the desination url the redirect
# 
# The intention is to gerenate personal short code URLs allowing analytics
# of the clicks, do to which user received them on for what product and which 
# day of the week it was sent, and which position in the message was clicked if there
# are multiple short-code-links in the same message.


# the code was developed for experimenting with traffic redirection for a shopping site


import os, json, sys
import random, string
import urllib2, hashlib

## Parameters
campaign = "test001"
senderid = 12345;
secretsalt = "my secret salt";
###


def id_generator(size=6, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

def createRedir(screen_name, position, e):
        obj = {}
        obj["shortcode"] = e["shortcode"]
        obj["screen_name"] = screen_name
        obj["user"] = hashlib.sha1(screen_name).hexdigest()
        obj["prodid"] = e["product_id"]
        obj["position"] = position
        obj["senderid"] = senderid
        obj["campaign"] = campaign
        obj["desturl"] = e["desturl"] # You could add the hashed userid for dest side tracking
        doc = json.dumps(obj)
        sig = hashlib.sha1(doc + secretsalt ).hexdigest()

        try:
            headers = {'User-Agent': "PosterBoy/1.0", 'x-msg': doc}
            # We should really use POST, but using GET for now
            req = urllib2.Request("http://localhost:8000/newshortcode/" + sig, headers=headers)
            usock = urllib2.urlopen(req)
            info = usock.read()
            usock.close()
        except urllib2.HTTPError as err:
            print err
        return e["shortcode"]


print "http://localhost:8000/"+createRedir("albert",1,{"shortcode":id_generator(), "product_id": "E123-546","desturl":"http://shopping.example.com?utm=tracking123"})
