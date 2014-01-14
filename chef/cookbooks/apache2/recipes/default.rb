package("apache2")

bash "set up apache to serve all files" do
  user "root"
  code <<-EOH
  rm -rf /var/www
  ln -fs /vagrant /var/www
  EOH
end