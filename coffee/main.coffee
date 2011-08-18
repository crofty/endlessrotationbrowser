w = 500
h = 500
API_URL = 'http://endlessrotation.com'
@App = App = SC.Application.create()
App.nodes = []
App.links = []

vis = d3.select("#chart")
  .append("svg:svg")
  .attr("width", w)
  .attr("height", h)
force = d3.layout
  .force()
  .charge(-50)
  .linkDistance(40)
  .friction(0)
  .nodes(App.nodes)
  .links(App.links)
  .size([ w, h ])

vis.append("svg:g").attr("class", "links")
vis.append("svg:g").attr("class", "nodes")
vis.style("opacity", 1e-6).transition().duration(1000).style "opacity", 1

force.on "tick", ->
  vis.selectAll("line.link")
    .attr("x1", (d) -> d.source.x)
    .attr("y1", (d) -> d.source.y)
    .attr("x2", (d) -> d.target.x)
    .attr("y2", (d) -> d.target.y)
  vis.selectAll("circle.node")
    .attr("cx", (d) -> d.x)
    .attr("cy", (d) -> d.y)

update = ->
  vis.select('g.links').selectAll("line.link")
    .data(App.links)
    .enter()
      .append("svg:line")
      .attr("class", "link")
      .attr("x1", (d) -> d.source.x)
      .attr("y1", (d) -> d.source.y)
      .attr("x2", (d) -> d.target.x)
      .attr("y2", (d) -> d.target.y)

  vis.select('g.nodes').selectAll("circle.node")
    .data(App.nodes)
    .enter()
      .append("svg:circle")
      .attr("class", "node")
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)
      .attr("r", (d) -> d.get('radius') || 5)
      .on("click", (d) -> d.nodeClicked() )
      .call(force.drag)
  force.start()


App.Node = SC.Object.extend
  nodeClicked: ->
    @selectNode()
  normalColor: '#141e2b'
  selectedColor: '#B3D733'
  selectNode: -> @set('selected',YES)
  d3elem: ->
    d3.selectAll('circle.node').filter (d) => d == this
  selectedDidChange: ( ->
    if @get('selected') == YES
      App.nodes.filter((n) =>
        n.get('selected') && n != this
      ).forEach (n) -> n.set('selected', NO)
      @d3elem().style('fill', @get('selectedColor'))
      App.selectedNodeController.set('content',this)
    else
      @d3elem().style('fill', @get('normalColor'))
  ).observes('selected')

App.MostCharted = App.Node.extend
  init: ->
    App.nodes.push this
    @getMoreTracks()
    @set('selected',true)
  isMostCharted: true
  tracks: SC.ArrayProxy.create(content:[])
  page: 1
  per_page: 10
  radius: 20
  x: w/2
  y: h/2
  getMoreTracks: ->
    page = @get('page')
    $.getJSON "#{API_URL}/most-charted/last-5-days.json?callback=?&per_page=#{@get('per_page')}&page=#{page}", (data) =>
      tracks = @get('tracks')
      @set('length', data.tracks.length)
      @set('info',data)
      data.tracks.forEach (jsonTrack) =>
        track = App.Track.create(jsonTrack)
        tracks.pushObject track
      update()
      @set('page',page++)
  nodeClicked: ->
    @_super()

App.Track = App.Node.extend
  init: ->
    App.nodes.push this
    App.links.push
      source: this
      target: @get('target') || App.mostCharted
  radius: 10
  isTrack: true
  getInfo: ->
    $.getJSON "#{API_URL + @get('url')}.json?callback=?", (data) =>
      @set('info', data)
      @showArtistNode()
      @showChartedByNode()
  selectedChanged: ( ->
    if @get('selected') and !@get('info')
      @getInfo()
  ).observes('selected')
  showArtistNode: ->
    info = @get('info')
    artist = App.Artist.create
      target: this
      id: info.artist_id
      name: info.artist_name
      url: info.artist_url
    @set('artist',artist)
  showChartedByNode: ->
    info = @get('info')
    chartedBy = App.ChartedBy.create
      track: this
      times: info.times_charted
      url: "#{@get('url')}/charted-by"
    @set('chartedBy',chartedBy)

App.Artist = App.Node.extend
  init: ->
    App.nodes.push this
    link =
      source: this
      target: @get('target')
    App.links.push link
    @set('link',link)
    update()
  isArtist: true
  radius: 7
  getInfo: ->
    $.getJSON "#{API_URL + @get('url')}.json?callback=?", (data) =>
      @set('info', data)
      chartedTracks = App.ChartedTracks.create
        artist: this
        times: data.times_charted
        url: "#{@get('url')}/charted-tracks"
      @set('chartedTracks',chartedTracks)
      artistTracks = App.ArtistTracks.create
        artist: this
        count: data.tracks_count
        url: "#{@get('url')}/tracks"
      @set('artistTracks',artistTracks)
  selectedChanged: ( ->
    if @get('selected') and !@get('info')
      @getInfo()
  ).observes('selected')

App.ArtistTracks = App.Node.extend
  init: ->
    App.nodes.push this
    link =
      source: this
      target: @get('artist')
    App.links.push link
    @set('link',link)
    update()
  isArtistTracks: true
  tracks: SC.ArrayProxy.create(content:[])
  getInfo: ->
    tracks = @get('tracks')
    $.getJSON "#{API_URL + @get('url')}.json?callback=?", (data) =>
      @set('info', data)
      @set('length', data.tracks.length)
      data.tracks.forEach (track) =>
        track = App.Track.create
          target: this
          title: track.title
          artist_name: track.artist
          url: track.url
        tracks.pushObject track
      update()
  selectedChanged: ( ->
    if @get('selected') and !@get('info')
      @getInfo()
  ).observes('selected')

App.ChartedTracks = App.Node.extend
  init: ->
    App.nodes.push this
    link =
      source: this
      target: @get('artist')
    App.links.push link
    @set('link',link)
    update()
  isChartedTracks: true
  tracks: SC.ArrayProxy.create(content:[])
  getInfo: ->
    tracks = @get('tracks')
    $.getJSON "#{API_URL + @get('url')}.json?callback=?", (data) =>
      @set('info', data)
      @set('length', data.charts.length)
      data.charts.forEach (chart) =>
        track = App.Track.create
          target: this
          title: chart.track.title
          artist_name: chart.track.artist_name
          url: chart.track.url
        tracks.pushObject track
      update()
  selectedChanged: ( ->
    if @get('selected') and !@get('info')
      @getInfo()
  ).observes('selected')

App.ChartedBy = App.Node.extend
  init: ->
    App.nodes.push this
    link =
      source: this
      target: @get('track')
    App.links.push link
    @set('link',link)
    update()
  isChartedBy: true
  users: SC.ArrayProxy.create(content:[])
  getInfo: ->
    users = @get('users')
    $.getJSON "#{API_URL + @get('url')}.json?callback=?", (data) =>
      @set('info', data)
      @set('length', data.charts.length)
      data.charts.forEach (chart) =>
        user = App.Artist.create
          target: this
          name: chart.user.name
          url: chart.user.url
        users.pushObject user
  selectedChanged: ( ->
    if @get('selected') and !@get('info')
      @getInfo()
  ).observes('selected')

# When a node is selected, it replaces the content of
# this controller.
# This controller just gives me something to bind against
App.selectedNodeController = SC.Object.create
  content: {}

# TODO: this should be done using SC.ContainerView
# doing it this way is very stupid by I don't have time
# to change it ATM
App.contentView = SC.View.create
  template: SC.Handlebars.compile '''
    {{#if content.isTrack}}
      {{view App.TrackView}}
    {{/if}}
    {{#if content.isArtist}}
      {{view App.ArtistView}}
    {{/if}}
    {{#if content.isChartedBy}}
      {{view App.ChartedByView}}
    {{/if}}
    {{#if content.isChartedTracks}}
      {{view App.ChartedTracksView}}
    {{/if}}
    {{#if content.isArtistTracks}}
      {{view App.ArtistTracksView}}
    {{/if}}
    {{#if content.isMostCharted}}
      {{view App.MostChartedView}}
    {{/if}}
    '''
  contentBinding: 'App.selectedNodeController.content'

App.NodeLink = SC.View.extend
  tagName: 'a'
  attributeBindings: ['href']
  href: '#',
  targetNode: ( ->
    target = @get('node')
    if SC.typeOf(target) == "string"
      return SC.getPath(this, target)
    else
      return target
  ).property('target').cacheable()
  mouseDown: ->
    node = @get('targetNode')
    node.set('selected',true)
    NO

App.MostChartedView = SC.View.extend
  contentBinding: 'parentView.parentView.content'
  elementId: 'most-charted'
  template: SC.Handlebars.compile '''
    <h2>Most Charted <span class="pagination-info">(Showing {{content.length}} of {{content.info.total_results}})</span></h2>
    {{#collection tagName="ol" contentBinding="content.tracks"}}
      {{#view App.NodeLink node=content}}
        {{parentView.content.artist_name}} - {{parentView.content.title}}
      {{/view}}
    {{/collection}}
  '''

App.TrackView = SC.View.extend
  contentBinding: 'parentView.parentView.content'
  didInsertElement: ->
    $.getJSON "http://gdata.youtube.com/feeds/api/videos?q=#{escape(@getPath('content.artist_name')+' - '+@getPath('content.title'))}&v=2&alt=jsonc&max-results=1&callback=?", (data) =>
      if (videoId = data?.data?.items?[0]?.id)
        new YT.Player 'video'
          height: 200
          width: 300
          videoId: videoId
          playerVars:
            'controls': 1,
            'enablejsapi': 1,
            'origin': window.location.host
  template: SC.Handlebars.compile '''
    <h2>{{content.artist_name}} - {{content.title}}</h2>
    <dl>
      <dt>Artist</dt>
      <dd>
        {{#view App.NodeLink node="parentView.content.artist"}}
          {{parentView.content.artist_name}}
        {{/view}}
      </dd>
      <dt>Times charted</dt>
      <dd>
        {{#view App.NodeLink node="parentView.content.chartedBy"}}
          {{parentView.content.info.times_charted}}
        {{/view}}
      </dd>
    </dl>
    <div id="video">
    </div>
  '''

App.ArtistView = SC.View.extend
  contentBinding: 'parentView.parentView.content'
  template: SC.Handlebars.compile '''
  <h2>{{content.name}}</h2>
  <dl>
    <dt>Charted Tracks</dt>
    <dd>
      {{#view App.NodeLink node="parentView.content.chartedTracks"}}
        {{parentView.content.info.charted_tracks_count}}
      {{/view}}
    </dd>
    <dt>Tracks</dt>
    <dd>
      {{#view App.NodeLink node="parentView.content.artistTracks"}}
        {{parentView.content.info.tracks_count}}
      {{/view}}
    </dd>
  </dl>
  '''

App.ChartedByView = SC.View.extend
  contentBinding: 'parentView.parentView.content'
  template: SC.Handlebars.compile '''
    <h2>{{content.track.artist_name}} - {{content.track.title}}</h2>
    <h2>Charted by <span class="pagination-info">(Showing {{content.length}} of {{content.info.total_results}})</span></h2>
    {{#collection contentBinding="content.users" tagName="ol"}}
      {{#view App.NodeLink node="parentView.content"}}
        {{parentView.content.name}}
      {{/view}}
    {{/collection}}
  '''

App.ChartedTracksView = SC.View.extend
  contentBinding: 'parentView.parentView.content'
  template: SC.Handlebars.compile '''
    <h2>{{content.artist.name}}</h2>
    <h2>Charted Tracks <span class="pagination-info">(Showing {{content.length}} of {{content.info.total_results}})</span></h2>
    {{#collection contentBinding="content.tracks" tagName="ol"}}
      {{#view App.NodeLink node="parentView.content"}}
        {{parentView.content.artist_name}} - {{parentView.content.title}}
      {{/view}}
    {{/collection}}
  '''

App.ArtistTracksView = SC.View.extend
  contentBinding: 'parentView.parentView.content'
  template: SC.Handlebars.compile '''
    <h2>Tracks by {{content.artist.name}} <span class="pagination-info">(Showing {{content.length}} of {{content.info.total_results}})</span></h2>
    {{#collection contentBinding="content.tracks" tagName="ol"}}
      {{#view App.NodeLink node="parentView.content"}}
        {{parentView.content.artist_name}} - {{parentView.content.title}}
      {{/view}}
    {{/collection}}
  '''

App.mostCharted = App.MostCharted.create()
App.contentView.appendTo('#content')
update()

$ ->
  tag = document.createElement('script')
  tag.src = 'http://www.youtube.com/player_api'
  firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
