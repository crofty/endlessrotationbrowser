require 'rack'

App = Rack::Builder.new {
  use Rack::Static, :urls => ['/css','/js','/images']
  run lambda { |env| [200, { 'Content-Type' => 'text/html', 'Cache-Control' => 'public, max-age=86400' }, File.open('index.html', File::RDONLY)] }
}

run App
