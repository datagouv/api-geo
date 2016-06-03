FROM node:latest

# Create app directory
RUN mkdir -p /usr/src/api-communes
WORKDIR /usr/src/api-communes

# Install app dependencies
COPY . /usr/src/api-communes
RUN npm install -—production -—unsafe-perm

EXPOSE 5000
CMD [ "npm", "start" ]
