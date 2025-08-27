# Start from the official AWS Lambda Node.js image
FROM public.ecr.aws/lambda/nodejs:18

# Install required tools (git, bash, unzip, etc.)
RUN yum install -y git jq bash unzip && yum clean all

WORKDIR /var/task

# Copy your code into the container
COPY . .

# Lambda entrypoint
CMD [ "app.handler" ]