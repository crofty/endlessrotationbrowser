(function() {
  var API_URL, App, force, h, update, vis, w;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  w = 500;
  h = 500;
  API_URL = 'http://endlessrotation.com';
  this.App = App = SC.Application.create();
  App.nodes = [];
  App.links = [];
  vis = d3.select("#chart").append("svg:svg").attr("width", w).attr("height", h);
  force = d3.layout.force().charge(-50).linkDistance(40).friction(0).nodes(App.nodes).links(App.links).size([w, h]);
  vis.append("svg:g").attr("class", "links");
  vis.append("svg:g").attr("class", "nodes");
  vis.style("opacity", 1e-6).transition().duration(1000).style("opacity", 1);
  force.on("tick", function() {
    vis.selectAll("line.link").attr("x1", function(d) {
      return d.source.x;
    }).attr("y1", function(d) {
      return d.source.y;
    }).attr("x2", function(d) {
      return d.target.x;
    }).attr("y2", function(d) {
      return d.target.y;
    });
    return vis.selectAll("circle.node").attr("cx", function(d) {
      return d.x;
    }).attr("cy", function(d) {
      return d.y;
    });
  });
  update = function() {
    vis.select('g.links').selectAll("line.link").data(App.links).enter().append("svg:line").attr("class", "link").attr("x1", function(d) {
      return d.source.x;
    }).attr("y1", function(d) {
      return d.source.y;
    }).attr("x2", function(d) {
      return d.target.x;
    }).attr("y2", function(d) {
      return d.target.y;
    });
    vis.select('g.nodes').selectAll("circle.node").data(App.nodes).enter().append("svg:circle").attr("class", "node").attr("cx", function(d) {
      return d.x;
    }).attr("cy", function(d) {
      return d.y;
    }).attr("r", function(d) {
      return d.get('radius') || 5;
    }).on("click", function(d) {
      return d.nodeClicked();
    }).call(force.drag);
    return force.start();
  };
  App.Node = SC.Object.extend({
    nodeClicked: function() {
      return this.selectNode();
    },
    normalColor: '#141e2b',
    selectedColor: '#B3D733',
    selectNode: function() {
      return this.set('selected', YES);
    },
    d3elem: function() {
      return d3.selectAll('circle.node').filter(__bind(function(d) {
        return d === this;
      }, this));
    },
    selectedDidChange: (function() {
      if (this.get('selected') === YES) {
        App.nodes.filter(__bind(function(n) {
          return n.get('selected') && n !== this;
        }, this)).forEach(function(n) {
          return n.set('selected', NO);
        });
        this.d3elem().style('fill', this.get('selectedColor'));
        return App.selectedNodeController.set('content', this);
      } else {
        return this.d3elem().style('fill', this.get('normalColor'));
      }
    }).observes('selected')
  });
  App.MostCharted = App.Node.extend({
    init: function() {
      App.nodes.push(this);
      this.getMoreTracks();
      return this.set('selected', true);
    },
    isMostCharted: true,
    tracks: SC.ArrayProxy.create({
      content: []
    }),
    page: 1,
    per_page: 10,
    radius: 20,
    x: w / 2,
    y: h / 2,
    getMoreTracks: function() {
      var page;
      page = this.get('page');
      return $.getJSON("" + API_URL + "/most-charted/last-5-days.json?callback=?&per_page=" + (this.get('per_page')) + "&page=" + page, __bind(function(data) {
        var tracks;
        tracks = this.get('tracks');
        this.set('length', data.tracks.length);
        this.set('info', data);
        data.tracks.forEach(__bind(function(jsonTrack) {
          var track;
          track = App.Track.create(jsonTrack);
          return tracks.pushObject(track);
        }, this));
        update();
        return this.set('page', page++);
      }, this));
    },
    nodeClicked: function() {
      return this._super();
    }
  });
  App.Track = App.Node.extend({
    init: function() {
      App.nodes.push(this);
      return App.links.push({
        source: this,
        target: this.get('target') || App.mostCharted
      });
    },
    radius: 10,
    isTrack: true,
    getInfo: function() {
      return $.getJSON("" + (API_URL + this.get('url')) + ".json?callback=?", __bind(function(data) {
        this.set('info', data);
        this.showArtistNode();
        return this.showChartedByNode();
      }, this));
    },
    selectedChanged: (function() {
      if (this.get('selected') && !this.get('info')) {
        return this.getInfo();
      }
    }).observes('selected'),
    showArtistNode: function() {
      var artist, info;
      info = this.get('info');
      artist = App.Artist.create({
        target: this,
        id: info.artist_id,
        name: info.artist_name,
        url: info.artist_url
      });
      return this.set('artist', artist);
    },
    showChartedByNode: function() {
      var chartedBy, info;
      info = this.get('info');
      chartedBy = App.ChartedBy.create({
        track: this,
        times: info.times_charted,
        url: "" + (this.get('url')) + "/charted-by"
      });
      return this.set('chartedBy', chartedBy);
    }
  });
  App.Artist = App.Node.extend({
    init: function() {
      var link;
      App.nodes.push(this);
      link = {
        source: this,
        target: this.get('target')
      };
      App.links.push(link);
      this.set('link', link);
      return update();
    },
    isArtist: true,
    radius: 7,
    getInfo: function() {
      return $.getJSON("" + (API_URL + this.get('url')) + ".json?callback=?", __bind(function(data) {
        var artistTracks, chartedTracks;
        this.set('info', data);
        chartedTracks = App.ChartedTracks.create({
          artist: this,
          times: data.times_charted,
          url: "" + (this.get('url')) + "/charted-tracks"
        });
        this.set('chartedTracks', chartedTracks);
        artistTracks = App.ArtistTracks.create({
          artist: this,
          count: data.tracks_count,
          url: "" + (this.get('url')) + "/tracks"
        });
        return this.set('artistTracks', artistTracks);
      }, this));
    },
    selectedChanged: (function() {
      if (this.get('selected') && !this.get('info')) {
        return this.getInfo();
      }
    }).observes('selected')
  });
  App.ArtistTracks = App.Node.extend({
    init: function() {
      var link;
      App.nodes.push(this);
      link = {
        source: this,
        target: this.get('artist')
      };
      App.links.push(link);
      this.set('link', link);
      return update();
    },
    isArtistTracks: true,
    tracks: SC.ArrayProxy.create({
      content: []
    }),
    getInfo: function() {
      var tracks;
      tracks = this.get('tracks');
      return $.getJSON("" + (API_URL + this.get('url')) + ".json?callback=?", __bind(function(data) {
        this.set('info', data);
        this.set('length', data.tracks.length);
        data.tracks.forEach(__bind(function(track) {
          track = App.Track.create({
            target: this,
            title: track.title,
            artist_name: track.artist,
            url: track.url
          });
          return tracks.pushObject(track);
        }, this));
        return update();
      }, this));
    },
    selectedChanged: (function() {
      if (this.get('selected') && !this.get('info')) {
        return this.getInfo();
      }
    }).observes('selected')
  });
  App.ChartedTracks = App.Node.extend({
    init: function() {
      var link;
      App.nodes.push(this);
      link = {
        source: this,
        target: this.get('artist')
      };
      App.links.push(link);
      this.set('link', link);
      return update();
    },
    isChartedTracks: true,
    tracks: SC.ArrayProxy.create({
      content: []
    }),
    getInfo: function() {
      var tracks;
      tracks = this.get('tracks');
      return $.getJSON("" + (API_URL + this.get('url')) + ".json?callback=?", __bind(function(data) {
        this.set('info', data);
        this.set('length', data.charts.length);
        data.charts.forEach(__bind(function(chart) {
          var track;
          track = App.Track.create({
            target: this,
            title: chart.track.title,
            artist_name: chart.track.artist_name,
            url: chart.track.url
          });
          return tracks.pushObject(track);
        }, this));
        return update();
      }, this));
    },
    selectedChanged: (function() {
      if (this.get('selected') && !this.get('info')) {
        return this.getInfo();
      }
    }).observes('selected')
  });
  App.ChartedBy = App.Node.extend({
    init: function() {
      var link;
      App.nodes.push(this);
      link = {
        source: this,
        target: this.get('track')
      };
      App.links.push(link);
      this.set('link', link);
      return update();
    },
    isChartedBy: true,
    users: SC.ArrayProxy.create({
      content: []
    }),
    getInfo: function() {
      var users;
      users = this.get('users');
      return $.getJSON("" + (API_URL + this.get('url')) + ".json?callback=?", __bind(function(data) {
        this.set('info', data);
        this.set('length', data.charts.length);
        return data.charts.forEach(__bind(function(chart) {
          var user;
          user = App.Artist.create({
            target: this,
            name: chart.user.name,
            url: chart.user.url
          });
          return users.pushObject(user);
        }, this));
      }, this));
    },
    selectedChanged: (function() {
      if (this.get('selected') && !this.get('info')) {
        return this.getInfo();
      }
    }).observes('selected')
  });
  App.selectedNodeController = SC.Object.create({
    content: {}
  });
  App.contentView = SC.View.create({
    template: SC.Handlebars.compile('{{#if content.isTrack}}\n  {{view App.TrackView}}\n{{/if}}\n{{#if content.isArtist}}\n  {{view App.ArtistView}}\n{{/if}}\n{{#if content.isChartedBy}}\n  {{view App.ChartedByView}}\n{{/if}}\n{{#if content.isChartedTracks}}\n  {{view App.ChartedTracksView}}\n{{/if}}\n{{#if content.isArtistTracks}}\n  {{view App.ArtistTracksView}}\n{{/if}}\n{{#if content.isMostCharted}}\n  {{view App.MostChartedView}}\n{{/if}}'),
    contentBinding: 'App.selectedNodeController.content'
  });
  App.NodeLink = SC.View.extend({
    tagName: 'a',
    attributeBindings: ['href'],
    href: '#',
    targetNode: (function() {
      var target;
      target = this.get('node');
      if (SC.typeOf(target) === "string") {
        return SC.getPath(this, target);
      } else {
        return target;
      }
    }).property('target').cacheable(),
    mouseDown: function() {
      var node;
      node = this.get('targetNode');
      node.set('selected', true);
      return NO;
    }
  });
  App.MostChartedView = SC.View.extend({
    contentBinding: 'parentView.parentView.content',
    elementId: 'most-charted',
    template: SC.Handlebars.compile('<h2>Most Charted <span class="pagination-info">(Showing {{content.length}} of {{content.info.total_results}})</span></h2>\n{{#collection tagName="ol" contentBinding="content.tracks"}}\n  {{#view App.NodeLink node=content}}\n    {{parentView.content.artist_name}} - {{parentView.content.title}}\n  {{/view}}\n{{/collection}}')
  });
  App.TrackView = SC.View.extend({
    contentBinding: 'parentView.parentView.content',
    didInsertElement: function() {
      return $.getJSON("http://gdata.youtube.com/feeds/api/videos?q=" + (escape(this.getPath('content.artist_name') + ' - ' + this.getPath('content.title'))) + "&v=2&alt=jsonc&max-results=1&callback=?", __bind(function(data) {
        var videoId, _ref, _ref2, _ref3;
        if ((videoId = data != null ? (_ref = data.data) != null ? (_ref2 = _ref.items) != null ? (_ref3 = _ref2[0]) != null ? _ref3.id : void 0 : void 0 : void 0 : void 0)) {
          return new YT.Player('video', {
            height: 200,
            width: 300,
            videoId: videoId,
            playerVars: {
              'controls': 1,
              'enablejsapi': 1,
              'origin': window.location.host
            }
          });
        }
      }, this));
    },
    template: SC.Handlebars.compile('<h2>{{content.artist_name}} - {{content.title}}</h2>\n<dl>\n  <dt>Artist</dt>\n  <dd>\n    {{#view App.NodeLink node="parentView.content.artist"}}\n      {{parentView.content.artist_name}}\n    {{/view}}\n  </dd>\n  <dt>Times charted</dt>\n  <dd>\n    {{#view App.NodeLink node="parentView.content.chartedBy"}}\n      {{parentView.content.info.times_charted}}\n    {{/view}}\n  </dd>\n</dl>\n<div id="video">\n</div>')
  });
  App.ArtistView = SC.View.extend({
    contentBinding: 'parentView.parentView.content',
    template: SC.Handlebars.compile('<h2>{{content.name}}</h2>\n<dl>\n  <dt>Charted Tracks</dt>\n  <dd>\n    {{#view App.NodeLink node="parentView.content.chartedTracks"}}\n      {{parentView.content.info.charted_tracks_count}}\n    {{/view}}\n  </dd>\n  <dt>Tracks</dt>\n  <dd>\n    {{#view App.NodeLink node="parentView.content.artistTracks"}}\n      {{parentView.content.info.tracks_count}}\n    {{/view}}\n  </dd>\n</dl>')
  });
  App.ChartedByView = SC.View.extend({
    contentBinding: 'parentView.parentView.content',
    template: SC.Handlebars.compile('<h2>{{content.track.artist_name}} - {{content.track.title}}</h2>\n<h2>Charted by <span class="pagination-info">(Showing {{content.length}} of {{content.info.total_results}})</span></h2>\n{{#collection contentBinding="content.users" tagName="ol"}}\n  {{#view App.NodeLink node="parentView.content"}}\n    {{parentView.content.name}}\n  {{/view}}\n{{/collection}}')
  });
  App.ChartedTracksView = SC.View.extend({
    contentBinding: 'parentView.parentView.content',
    template: SC.Handlebars.compile('<h2>{{content.artist.name}}</h2>\n<h2>Charted Tracks <span class="pagination-info">(Showing {{content.length}} of {{content.info.total_results}})</span></h2>\n{{#collection contentBinding="content.tracks" tagName="ol"}}\n  {{#view App.NodeLink node="parentView.content"}}\n    {{parentView.content.artist_name}} - {{parentView.content.title}}\n  {{/view}}\n{{/collection}}')
  });
  App.ArtistTracksView = SC.View.extend({
    contentBinding: 'parentView.parentView.content',
    template: SC.Handlebars.compile('<h2>Tracks by {{content.artist.name}} <span class="pagination-info">(Showing {{content.length}} of {{content.info.total_results}})</span></h2>\n{{#collection contentBinding="content.tracks" tagName="ol"}}\n  {{#view App.NodeLink node="parentView.content"}}\n    {{parentView.content.artist_name}} - {{parentView.content.title}}\n  {{/view}}\n{{/collection}}')
  });
  App.mostCharted = App.MostCharted.create();
  App.contentView.appendTo('#content');
  update();
  $(function() {
    var firstScriptTag, tag;
    tag = document.createElement('script');
    tag.src = 'http://www.youtube.com/player_api';
    firstScriptTag = document.getElementsByTagName('script')[0];
    return firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  });
}).call(this);
