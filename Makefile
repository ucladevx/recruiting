default: build run

dev: build-dev run-dev

setup:
	if [ ! -f app/config/SESSION_SECRET ]; then \
		cat /dev/urandom | od -N 32 -t x4 -An | tr -d '\n ' > app/config/SESSION_SECRET; \
	fi

certs:
	gpg certs.tar.gz.gpg
	tar -xvzf certs.tar.gz
	rm -rf certs.tar.gz

gen-certs:
	rm -rf certs-data
	mkdir -p certs-data
	sudo docker run -it --rm -v $(pwd)/certs:/etc/letsencrypt -v $(pwd)/certs-data:/data/letsencrypt deliverous/certbot certonly --webroot --webroot-path=/data/letsencrypt -d members.uclaacm.com

env:
	gpg node.env.gpg

gen-env:
	gpg -c node.env

update:
	git pull origin master
	git submodule update --init --recursive

build-dev:
	sudo docker-compose -f docker-compose.dev.yml build

build:
	sudo docker-compose build

run-dev:
	sudo docker-compose -f docker-compose.dev.yml up --remove-orphans

run:
	sudo docker-compose up -d

logs:
	sudo docker logs --follow $$(sudo docker ps | grep "devx/recruiting " | cut -d' ' -f1)

nginx-logs:
	sudo docker exec -it $$(sudo docker ps | grep "devx/recruiting-ui" | cut -d' ' -f1) tail -f /var/log/nginx/access.log

psql:
	sudo docker exec -it $$(sudo docker ps | grep "postgres" | cut -d' ' -f1) psql -U user

pg_bkup:
	sudo docker exec -it $$(sudo docker ps | grep "postgres" | cut -d' ' -f1) /bin/ash -c 'pg_dump -U postgres > "/backup/pg_bkup_$(shell date --iso-8601=minutes)"'

stop:
	sudo docker-compose down

reset: stop
	-sudo docker rm $$(sudo docker ps -aq)
	-sudo docker rmi devx/recruiting
	-sudo docker rmi devx/recruiting-ui
	-sudo docker volume rm postgres_data
	-sudo docker volume rm recruiting_postgres_data

.PHONY: pg_bkup
