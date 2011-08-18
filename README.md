# Endless Rotation Browser

NOTE: This was very quickly hacked together for the [Sproutcore Demo App Hackathon](http://demohackathon.strobeapp.com/). I've only tested it in Chrome.

This example app allows you to browse data pulled from the [Endless Rotation](http://endlessrotation.com/) API.  When the page first loads, you are shown the top 10 most charted tracks over the last 5 days.  You can then start exploring the dataset by clicking on the track names or the nodes in the graph.

Building this allowed me to play around with [d3.js](http://mbostock.github.com/d3/) and I've concluded that it's great.

Compile files with:

    coffee -w -o js/ -c coffee/*
    compass watch --sass-dir sass --css-dir css
