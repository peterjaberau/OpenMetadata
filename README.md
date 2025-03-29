

# 1- TO RUN THE BACKEND:

```bash
docker compose -f docker/development/docker-compose.yml up mysql elasticsearch --build -d
```

ensure elasticsearch and mysql are running on docker



# 2- Create distribution:

From terminal - macos:
```bash
cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata/openmetadata-dist/target/openmetadata-1.6.0-SNAPSHOT
sh bin/openmetadata-server-start.sh conf/openmetadata.yaml
```


# 3- run ui by connecting to the existing server (from steps 1 and 2)

from root folder

```bash:
export DEV_SERVER_TARGET=http://localhost:8585/
make yarn_start_dev_ui
```

* **username**: admin@open-metadata.org
* **password**: admin
