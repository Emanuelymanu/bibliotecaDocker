Coloque nesta pasta os certificados locais gerados para estantedigital.local.

Arquivos esperados pelo Nginx:
- estantedigital.local.pem
- estantedigital.local-key.pem

Exemplo com mkcert:
mkcert -cert-file estantedigital.local.pem -key-file estantedigital.local-key.pem estantedigital.local