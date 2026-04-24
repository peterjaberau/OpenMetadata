#  Copyright 2025 Collate
#  Licensed under the Collate Community License, Version 1.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  https://github.com/open-metadata/OpenMetadata/blob/main/ingestion/LICENSE
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""
Strategy adapters for classifiable entity types (Table, Container, …).

Each adapter encodes the per-type knowledge that would otherwise be scattered
across isinstance checks:
  - how to access/set columns
  - which fields to PATCH
  - which pipeline config class maps to this entity
  - which ServiceType to use
  - how to build the kwargs for SamplerInterface.create()

Adding a new classifiable entity type (e.g. DashboardDataModel) means:
  1. Add a new adapter subclass here
  2. Register it in _BY_ENTITY and _BY_PIPELINE
  3. Extend ClassifiableEntityType in pii/types.py
  4. Extend the isinstance tuple in workflow/classification.py
No other files need to change.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from copy import deepcopy
from typing import TYPE_CHECKING, Dict, List, Optional, Type

from metadata.generated.schema.entity.data.container import Container
from metadata.generated.schema.entity.data.table import Column, Table
from metadata.generated.schema.entity.services.serviceType import ServiceType
from metadata.generated.schema.metadataIngestion.databaseServiceAutoClassificationPipeline import (
    DatabaseServiceAutoClassificationPipeline,
)
from metadata.generated.schema.metadataIngestion.storageServiceAutoClassificationPipeline import (
    StorageServiceAutoClassificationPipeline,
)
from metadata.sampler.config import get_config_for_table
from metadata.sampler.config_utils import build_database_service_conn_config
from metadata.sampler.models import SampleConfig
from metadata.utils.profiler_utils import get_context_entities

if TYPE_CHECKING:
    from metadata.generated.schema.metadataIngestion.workflow import (
        OpenMetadataWorkflowConfig,
    )
    from metadata.ingestion.ometa.ometa_api import OpenMetadata


class EntityAdapter(ABC):
    """Strategy for entity-type-specific behaviour in the classification pipeline.

    Adapters are stateless — all inputs are passed as arguments.
    They describe entity *structure* only; they do not call external APIs.
    """

    pipeline_config_class: Type
    service_type: ServiceType
    patch_fields: List[str]

    @abstractmethod
    def get_columns(self, entity) -> Optional[List[Column]]:
        """Return the entity's columns, or None if unavailable."""

    @abstractmethod
    def set_columns(self, entity, columns) -> None:
        """Set the entity's column list in-place."""

    @abstractmethod
    def build_sampler_kwargs(
        self,
        config: "OpenMetadataWorkflowConfig",
        metadata: "OpenMetadata",
        entity,
        profiler_config,
        source_config,
    ) -> Optional[Dict]:
        """Return kwargs for SamplerInterface.create(), or None on unrecoverable error."""


class TableAdapter(EntityAdapter):
    pipeline_config_class = DatabaseServiceAutoClassificationPipeline
    service_type = ServiceType.Database
    patch_fields = ["tags", "columns"]

    def get_columns(self, entity: Table) -> Optional[List[Column]]:
        return entity.columns

    def set_columns(self, entity: Table, columns) -> None:
        entity.columns = columns

    def build_sampler_kwargs(
        self,
        config: "OpenMetadataWorkflowConfig",
        metadata: "OpenMetadata",
        entity: Table,
        profiler_config,
        source_config,
    ) -> Optional[Dict]:
        schema_entity, database_entity, _ = get_context_entities(
            entity=entity, metadata=metadata
        )
        if database_entity is None:
            return None
        return {
            "service_connection_config": build_database_service_conn_config(
                config, database_entity
            ),
            "ometa_client": metadata,
            "entity": entity,
            "schema_entity": schema_entity,
            "database_entity": database_entity,
            "table_config": get_config_for_table(entity, profiler_config),
            "default_sample_config": SampleConfig(),
            "default_sample_data_count": source_config.sampleDataCount,
        }


class ContainerAdapter(EntityAdapter):
    pipeline_config_class = StorageServiceAutoClassificationPipeline
    service_type = ServiceType.Storage
    patch_fields = ["tags", "dataModel"]

    def get_columns(self, entity: Container) -> Optional[List[Column]]:
        return entity.dataModel.columns if entity.dataModel else None

    def set_columns(self, entity: Container, columns) -> None:
        if entity.dataModel:
            entity.dataModel.columns = columns

    def build_sampler_kwargs(
        self,
        config: "OpenMetadataWorkflowConfig",
        metadata: "OpenMetadata",
        entity: Container,
        profiler_config,
        source_config,
    ) -> Optional[Dict]:
        return {
            "service_connection_config": deepcopy(
                config.source.serviceConnection.root.config
            ),
            "ometa_client": metadata,
            "entity": entity,
            "schema_entity": None,
            "database_entity": None,
            "table_config": None,
            "default_sample_config": SampleConfig(),
            "default_sample_data_count": source_config.sampleDataCount,
        }


_BY_ENTITY: Dict[type, EntityAdapter] = {
    Table: TableAdapter(),
    Container: ContainerAdapter(),
}

_BY_PIPELINE: Dict[type, EntityAdapter] = {
    DatabaseServiceAutoClassificationPipeline: TableAdapter(),
    StorageServiceAutoClassificationPipeline: ContainerAdapter(),
}


def adapter_for(entity) -> Optional[EntityAdapter]:
    """Look up the adapter for a classifiable entity instance."""
    return _BY_ENTITY.get(type(entity))


def adapter_for_pipeline(pipeline_config) -> Optional[EntityAdapter]:
    """Look up the adapter for a pipeline config instance."""
    return _BY_PIPELINE.get(type(pipeline_config))
