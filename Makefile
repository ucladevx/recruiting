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
	sudo docker run \
		-v $(shell pwd)/certs:/etc/letsencrypt \
		-e domains="recruiting.ucladevx.com" \
		-e email="ucladevx@gmail.com" \
		-p 80:80 \
		-p 443:443 \
		--rm pierreprinetti/certbot:latest
	sudo tar -cvzf certs.tar.gz certs
	gpg -c certs.tar.gz
	rm -rf certs.tar.gz

env:
	gpg node.env.tar.gz.gpg
	tar -xvzf node.env.tar.gz
	rm -rf node.env.tar.gz

gen-env:
	tar -cvzf node.env.tar.gz node.env node.dev.env
	gpg -c node.env.tar.gz
	rm -rf node.env.tar.gz

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

sh:
	sudo docker exec -it $$(sudo docker ps | grep "devx/recruiting " | cut -d' ' -f1) /bin/ash

psql:
	sudo docker exec -it $$(sudo docker ps | grep "postgres" | cut -d' ' -f1) psql -U postgres

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
