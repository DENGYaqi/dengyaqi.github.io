require 'json'
require 'yaml'

root = File.expand_path('../..', __dir__)
data = YAML.safe_load_file(File.join(root, '_data', 'experience.yml'))
public_fields = data.map { |item| item.slice('key', 'title', 'company', 'date', 'summary', 'tags') }
File.write(File.join(root, 'experience-app', 'src', 'experiences.json'), JSON.pretty_generate(public_fields) + "\n")
