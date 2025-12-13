require 'socket'
require 'json'

PORT = ENV.fetch('PORT', '3000').to_i

puts "Backend server running on port #{PORT}"

server = TCPServer.new('0.0.0.0', PORT)

loop do
  client = server.accept
  
  request_line = client.gets
  
  # Read headers
  headers = {}
  while (line = client.gets) && (line.chomp != '')
    key, value = line.split(': ', 2)
    headers[key] = value.chomp if value
  end
  
  # Parse request
  method, path, _version = request_line.split(' ')
  
  # Route handling
  response_body = ''
  status = '200 OK'
  content_type = 'application/json'
  
  case path
  when '/health'
    response_body = JSON.generate({status: 'ok'})
  when '/api/v1/greetings'
    response_body = JSON.generate({
      greeting: 'Hello from Rails API!',
      fact: {
        id: 1,
        text: 'Ruby on Rails was created by David Heinemeier Hansson in 2004',
        category: 'technology'
      }
    })
  else
    status = '404 Not Found'
    response_body = JSON.generate({error: 'Not Found'})
  end
  
  # Send response
  client.puts "HTTP/1.1 #{status}"
  client.puts "Content-Type: #{content_type}"
  client.puts "Content-Length: #{response_body.bytesize}"
  client.puts "Access-Control-Allow-Origin: *"
  client.puts "Connection: close"
  client.puts ""
  client.puts response_body
  
  client.close
end
