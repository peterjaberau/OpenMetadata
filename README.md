# cookbook

```bash


# 1- setup new docker vms (mysql + elasticsearch). 
# Output. 2 vms up and running
docker compose -f docker/development/docker-compose.yml up mysql elasticsearch --build -d

# 2- create distribution for openmetadata to be deployed to the docker vms
# Output. openmetadata-dist/target/openmetadata-1.6.0-SNAPSHOT.tar.gz created 

cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata

(delete old yarn.lock)
corepack enable
corepack prepare yarn@3.3.1 --activate
yarn -v

mvn clean install -DskipTests

#3. Bootstartp MySQL from the created distribution in point 2

- manual:  Extract the distribution tar.gz
cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata/openmetadata-dist/target/openmetadata-1.6.0-SNAPSHOT
sh bootstrap/openmetadata-ops.sh drop-create


#4. Run the server
cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata/openmetadata-dist/target/openmetadata-1.6.0-SNAPSHOT
sh bin/openmetadata-server-start.sh conf/openmetadata.yaml


#5- Load Sample Data into MySQL
(from os terminal)

cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata
python3 -m venv venv
source venv/bin/activate
make install_dev generate
cd ingestion
pip install -e '.[sample-data, elasticsearch]'
metadata ingest -c ./pipelines/sample_data.json
metadata usage -c ./pipelines/sample_usage.json


Access to server api:
https://localhost:8585/api
Access to UI
https://localhost:8585 
* **username**: admin@open-metadata.org
* **password**: admin


#6- Run the UI - from dev

#dependencies
cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata/openmetadata-ui/src/main/resources/ui
yarn install

#state files 
cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata
changed_files=$(git diff --cached --name-only --diff-filter=ACM | grep 'openmetadata-spec/src/main/resources/json/schema/')

#generate ts files
cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata
./openmetadata-ui/src/main/resources/ui/json2ts.sh $changed_files


# for ui installatio
cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata
npm uninstall -g yarn
npm install -g yarn@1.22.0


cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata
rm -rf yarn.lock node_modules

# install ui dependencies
make yarn_install_cache

# install run the dev ui
make yarn_start_dev_ui

export DEV_SERVER_TARGET=http://localhost:8585/
make yarn_start_dev_ui


```




# 1- TO RUN THE BACKEND:

https://docs.open-metadata.org/latest/quick-start/local-docker-deployment
```bash

- ready deployable docker
mkdir openmetadata-docker && cd openmetadata-docker

curl -sL -o docker-compose.yml https://github.com/open-metadata/OpenMetadata/releases/download/1.6.7-release/docker-compose.yml
wget https://github.com/open-metadata/OpenMetadata/releases/download/1.6.7-release/docker-compose.yml


docker compose -f docker-compose.yml up --detach


cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata/openmetadata-dist/target/openmetadata-1.6.0-SNAPSHOT
sh bootstrap/openmetadata-ops.sh drop-create

------
- from IDE in case build then docker

cd /Users/peterjaber/Desktop/Easyflow.io/Code/OpenMetadata
docker compose -f docker/development/docker-compose.yml up mysql elasticsearch --build -d
```

ensure elasticsearch and mysql are running on docker


```text
+] Running 7/8
⠿ Network metadata_app_net                        Created                                                                                               0.2s
⠿ Volume "metadata_ingestion-volume-dag-airflow"  Created                                                                                               0.0s
⠿ Volume "metadata_ingestion-volume-dags"         Created                                                                                               0.0s
⠿ Volume "metadata_ingestion-volume-tmp"          Created                                                                                               0.0s
⠿ Container openmetadata_elasticsearch            Started                                                                                               5.9s
⠿ Container openmetadata_mysql                    Started                                                                                              38.3s
⠿ Container openmetadata_server                   Started                                                                                             124.8s
⠿ Container openmetadata_ingestion                Started

❯ docker ps
CONTAINER ID   IMAGE                                                  COMMAND                  CREATED          STATUS                    PORTS                                                            NAMES
470cc8149826   openmetadata/server:1.6.7                             "./openmetadata-star…"   45 seconds ago   Up 43 seconds             3306/tcp, 9200/tcp, 9300/tcp, 0.0.0.0:8585-8586->8585-8586/tcp   openmetadata_server
63578aacbff5   openmetadata/ingestion:1.6.7                           "./ingestion_depende…"   45 seconds ago   Up 43 seconds             0.0.0.0:8080->8080/tcp                                           openmetadata_ingestion
9f5ee8334f4b   docker.elastic.co/elasticsearch/elasticsearch:7.16.3   "/tini -- /usr/local…"   45 seconds ago   Up 44 seconds             0.0.0.0:9200->9200/tcp, 0.0.0.0:9300->9300/tcp                   openmetadata_elasticsearch
08947ab3424b   openmetadata/db:1.6.7                                  "/entrypoint.sh mysq…"   45 seconds ago   Up 44 seconds (healthy)   3306/tcp, 33060-33061/tcp                                        openmetadata_mysql

```


* **username**: admin@open-metadata.org
* **password**: admin
