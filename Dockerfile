FROM node:latest

# Create app directory
RUN mkdir -p /usr/src/api-communes
WORKDIR /usr/src/api-communes

# Install app dependencies
COPY package.json /usr/src/api-communes
COPY yarn.lock /usr/src/api-communes
RUN yarn --prod

# Copy sources
COPY . /usr/src/api-communes

# Prepare data
RUN yarn build

EXPOSE 5000
CMD [ "yarn", "start" ]
