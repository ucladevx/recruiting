# recruiting

The DevX recruiting platform


### Prerequisites

You must have either Docker or Vagrant installed and the repository cloned.  `cd` to the respository. Initialize and download the static (frontend) submobule:

```bash
user@local:~$ cd recruiting
user@local:~/recruiting$ make update
```

### Setup (Vagrant)

If you don't want to use vagrant and simply want to deploy with Docker, you can skip this section.

The Vagrantfile is setup to include all the system dependencies, including Docker. Simply run these commands and the virtual machine will be completely set up.

```bash
user@local:~/recruiting$ vagrant up --provision
user@local:~/recruiting$ vagrant ssh
vagrant@acm:~$ cd /vagrant
```

### Setup (App)

The very first time you deploy, you need to set up the environment:

```bash
$ make setup
```

You also need to decrypt the environment variables and SSL certificates (a password is required):

```bash
$ make certs
$ make env
```

### Deploy

To deploy:

```Bash
$ make
```

To stop all services (including the databases):

```Bash
$ make stop
```

To run in development mode:

```Bash
$ make dev
```

The following commands are also available:

- `make logs` – attach to the standard output of the process and view the logs
- `make nginx-logs` - attach to the nginx server and view access log
- `make psql` - attach to the database and run queries
- `make pg_bkup` - take a snapshot of the database
- `make reset` – completely obliterate the currently built images
- `make build` – only run the image build
- `make run` – only run in detached mode
- `make run-dev` – only run in attached mode

### Accessing the Server

The nginx server runs on ports `80` and `443`, and all API routes can be accessed through nginx by prepending `/app` to API URLs (e.g. `/app/api/v1/auth/login` and `/app/api/v1/user`).

If you're running the app in production mode from inside the vagrant machine, access the website using port `3000`. If you're running the backend in development mode and the frontend separately using `make dev`, access the website using port `7801`.

If you're running the app in production more outside of a virtual machine, access the website using regular http (port `80` or `443`). If you're running the backend in development mode and the frontend separately using `make dev`, access the website using port `7800`.
