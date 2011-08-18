# Endless Rotation Browser

NOTE: This was very quickly hacked together for the [Sproutcore Demo App Hackathon](http://demohackathon.strobeapp.com/). I've only tested it in Chrome.

This example app allows you to browse data pulled from the [Endless Rotation](http://endlessrotation.com/) API.  When the page first loads, you are shown the top 10 most charted tracks over the last 5 days.  You can then start exploring the dataset by clicking on the track names or the nodes in the graph.

Building this allowed me to play around with [d3.js](http://mbostock.github.com/d3/) and I've concluded that it's great.


### My notes:

TODO:

- Check to see if it works in any other browsers
- Colour and Size the nodes differently depending on their type.  You should be able to tell when looking at the graph, which nodes are tracks, which are artists etc.
- A click on a 'paginated node' should load and display the next page of data
- Use a ContainerView for the content div.  The current method of using `{{#if}}` in the handlebars templates is super hacky
- Optimise the code.  It starts running really slowly when displaying more than a few nodes
- Fix all the YouTube errors
- Work out why I'm getting the `Maximum call stack size exceeded` Sproutcore error when opening a few nodes

When developing, compile files with:

    coffee -w -o js/ -c coffee/*
    compass watch --sass-dir sass --css-dir css
