# load the alpine base image
FROM alpine:3.5

# install dependencies
RUN apk add -U 'nodejs<=6.10' python make gcc g++

# create the working directory
RUN mkdir -p /var/www/recruiting

# copy the package.json and shinkwrap file to app location
# copy the node_modules to app location
COPY *.json /var/www/recruiting/

# install the deps
RUN cd /var/www/recruiting && \
    npm install --production && \
    npm rebuild bcrypt --build-from-source

# set the working direction and copy the source
WORKDIR /var/www/recruiting
COPY . /var/www/recruiting

# open a port and start the server
EXPOSE 8080
CMD ["node", "index"]
