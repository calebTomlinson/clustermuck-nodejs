clustermuck-nodejs
==================

Cluster your mucky garbage. A strategy for non-blocking garbage collection in nodejs.

We were seeing apps blocking for 100-300ms and longer for garbage collection. This module attempts to circumvent those pauses by utilizing nodejs clustering.

1) Start a cluster of workers to accept traffic.

2) The master coordinates the following loop in each child

```
for (workers in cluster){
  Worker stops accepting connections.
  Once requests have finished and connections have clossed: collect garbage
  start accepting connections
  tell master gc is finished
}
```
