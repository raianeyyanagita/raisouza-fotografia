require 'webrick'
require 'json'
require 'securerandom'
require 'digest'

# Corrige bug do sendfile no macOS com Ruby 2.6 WEBrick
module WEBrick
  class HTTPResponse
    def send_body_io(socket)
      begin
        while buf = @body.read(16384)
          socket.write(buf)
        end
      ensure
        @body.close
      end
    end
  end
end

PORT = 3333
ROOT_DIR = File.expand_path(__dir__)
DATA_DIR = File.join(ROOT_DIR, 'data')
UPLOADS_DIR = File.join(ROOT_DIR, 'uploads')
DB_FILE = File.join(DATA_DIR, 'database.json')
AUTH_FILE = File.join(DATA_DIR, 'auth.json')
SESSIONS_FILE = File.join(DATA_DIR, 'sessions.json')

Dir.mkdir(DATA_DIR) unless Dir.exist?(DATA_DIR)
Dir.mkdir(UPLOADS_DIR) unless Dir.exist?(UPLOADS_DIR)

# Inicializa credenciais exclusivas da fotógrafa (usuário padrão: raimes | senha padrão: 123456)
unless File.exist?(AUTH_FILE)
  default_auth = {
    'username' => 'raimes',
    'password_hash' => Digest::SHA256.hexdigest('123456')
  }
  File.write(AUTH_FILE, JSON.pretty_generate(default_auth), encoding: 'UTF-8')
end

unless File.exist?(SESSIONS_FILE)
  File.write(SESSIONS_FILE, JSON.pretty_generate({}), encoding: 'UTF-8')
end

def load_sessions
  JSON.parse(File.read(SESSIONS_FILE, encoding: 'UTF-8'))
rescue
  {}
end

def save_sessions(sessions)
  File.write(SESSIONS_FILE, JSON.pretty_generate(sessions), encoding: 'UTF-8')
end

def valid_token?(req)
  auth_header = req['Authorization'].to_s
  token = auth_header.sub(/^Bearer\s+/i, '').strip
  return false if token.empty?
  sessions = load_sessions
  sessions.key?(token)
end

def json_response(res, status, payload)
  res.status = status
  res['Content-Type'] = 'application/json; charset=utf-8'
  res['Access-Control-Allow-Origin'] = '*'
  res['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  res['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
  res.body = JSON.generate(payload)
end

server = WEBrick::HTTPServer.new(
  Port: PORT,
  BindAddress: '127.0.0.1',
  DocumentRoot: ROOT_DIR,
  Logger: WEBrick::Log.new($stdout, WEBrick::Log::INFO),
  AccessLog: [[$stdout, WEBrick::AccessLog::COMMON_LOG_FORMAT]]
)

# API: Ler e Salvar Dados do Site (Preços, Planos, Fotos, Álbuns YouFocus e Configurações)
server.mount_proc '/api/site' do |req, res|
  if req.request_method == 'OPTIONS'
    json_response(res, 200, { ok: true })
  elsif req.request_method == 'GET'
    data = JSON.parse(File.read(DB_FILE, encoding: 'UTF-8'))
    json_response(res, 200, data)
  elsif req.request_method == 'POST'
    unless valid_token?(req)
      json_response(res, 401, { error: 'Acesso negado. Faça login novamente.' })
      next
    end
    begin
      new_data = JSON.parse(req.body.force_encoding('UTF-8'))
      File.write(DB_FILE, JSON.pretty_generate(new_data), encoding: 'UTF-8')
      json_response(res, 200, { success: true, message: 'Site atualizado com sucesso!', data: new_data })
    rescue => e
      json_response(res, 400, { error: "Erro ao salvar alterações: #{e.message}" })
    end
  else
    json_response(res, 405, { error: 'Método não permitido' })
  end
end

# API: Autenticação Exclusiva da Fotógrafa
server.mount_proc '/api/auth' do |req, res|
  if req.request_method == 'OPTIONS'
    json_response(res, 200, { ok: true })
    next
  end

  if req.request_method == 'POST'
    begin
      body = JSON.parse(req.body.force_encoding('UTF-8'))
      action = body['action'] || 'login'
      auth_data = JSON.parse(File.read(AUTH_FILE, encoding: 'UTF-8'))

      if action == 'login'
        user = body['username'].to_s.strip.downcase
        pass = body['password'].to_s
        pass_hash = Digest::SHA256.hexdigest(pass)

        if user == auth_data['username'].downcase && pass_hash == auth_data['password_hash']
          token = SecureRandom.hex(24)
          sessions = load_sessions
          sessions[token] = { 'username' => auth_data['username'], 'created_at' => Time.now.to_i }
          save_sessions(sessions)
          json_response(res, 200, { success: true, token: token, username: auth_data['username'] })
        else
          json_response(res, 401, { success: false, error: 'Usuário ou senha incorretos.' })
        end
      elsif action == 'change_credentials'
        unless valid_token?(req)
          json_response(res, 401, { error: 'Sessão inválida.' })
          next
        end
        new_user = body['newUsername'].to_s.strip
        new_pass = body['newPassword'].to_s
        if new_user.empty? || new_pass.length < 4
          json_response(res, 400, { error: 'Informe um usuário válido e uma senha com pelo menos 4 caracteres.' })
          next
        end
        auth_data['username'] = new_user
        auth_data['password_hash'] = Digest::SHA256.hexdigest(new_pass)
        File.write(AUTH_FILE, JSON.pretty_generate(auth_data), encoding: 'UTF-8')
        json_response(res, 200, { success: true, message: 'Seu login e senha foram atualizados com sucesso!' })
      elsif action == 'verify'
        json_response(res, 200, { valid: valid_token?(req) })
      elsif action == 'logout'
        auth_header = req['Authorization'].to_s
        token = auth_header.sub(/^Bearer\s+/i, '').strip
        sessions = load_sessions
        sessions.delete(token)
        save_sessions(sessions)
        json_response(res, 200, { success: true })
      end
    rescue => e
      json_response(res, 400, { error: e.message })
    end
  end
end

# API: Upload de Fotos Reais (salva na pasta /uploads)
server.mount_proc '/api/upload' do |req, res|
  if req.request_method == 'OPTIONS'
    json_response(res, 200, { ok: true })
    next
  end

  unless valid_token?(req)
    json_response(res, 401, { error: 'Acesso negado.' })
    next
  end

  if req.request_method == 'POST'
    begin
      body = JSON.parse(req.body.force_encoding('UTF-8'))
      data_url = body['image'].to_s
      if data_url =~ /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i
        ext = $1.downcase == 'jpeg' ? 'jpg' : $1.downcase
        raw_bytes = $2.unpack1('m')
        filename = "foto_#{Time.now.to_i}_#{SecureRandom.hex(4)}.#{ext}"
        filepath = File.join(UPLOADS_DIR, filename)
        File.open(filepath, 'wb') { |f| f.write(raw_bytes) }
        json_response(res, 200, { success: true, url: "uploads/#{filename}" })
      else
        json_response(res, 400, { error: 'Formato de imagem inválido. Envie JPG, PNG ou WEBP.' })
      end
    rescue => e
      json_response(res, 500, { error: "Erro no upload: #{e.message}" })
    end
  end
end

trap('INT') { server.shutdown }
trap('TERM') { server.shutdown }

puts "===================================================="
puts "📸 Ráimes Souza Fotografia — Site + Backend Admin"
puts "👉 Acesse no navegador: http://localhost:#{PORT}"
puts "🔒 Usuário da Fotógrafa: raimes | Senha Padrão: 123456"
puts "===================================================="
server.start
