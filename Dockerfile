FROM ubuntu:latest
LABEL authors="sagar"

ENTRYPOINT ["top", "-b"]