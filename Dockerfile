FROM nginx:1.29-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY moose1.png moose2.png moose3.png moose4.png moose5.png moose6.png moose7.png /usr/share/nginx/html/img/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
