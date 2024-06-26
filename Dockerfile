FROM node:latest

# Args
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ARG COMMUNES_ASSOCIEES_DELEGUEES=NO
ENV COMMUNES_ASSOCIEES_DELEGUEES=$COMMUNES_ASSOCIEES_DELEGUEES

# Create app directory
RUN mkdir -p /usr/src/api-communes
WORKDIR /usr/src/api-communes

# Install app dependencies
COPY package.json /usr/src/api-communes
COPY yarn.lock /usr/src/api-communes
RUN NODE_ENV=development yarn add yarn

# Copy sources
COPY . /usr/src/api-communes

# Prepare data
RUN yarn build

EXPOSE 5000
CMD [ "yarn", "start" ]
