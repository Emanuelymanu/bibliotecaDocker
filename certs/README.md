Coloque nesta pasta os certificados locais gerados para estantedigital.local.

Arquivos esperados pelo Nginx:
- estantedigital.local.pem
- estantedigital.local-key.pem

Exemplo com mkcert:
mkcert -cert-file estantedigital.local.pem -key-file estantedigital.local-key.pem estantedigital.local

Antes de abrir o site no Chrome, execute também o comando abaixo em cada computador
que vai acessar o ambiente:

mkcert -install

Isso instala e confia na CA local do mkcert, evitando o aviso de site inseguro no navegador.