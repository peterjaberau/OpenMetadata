import { DefaultOptionType } from 'antd/lib/select';
import { AxiosError } from 'axios';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader/Loader';
import { AssetsUnion } from '../../components/DataAssets/AssetsSelectionModal/AssetSelectionModal.interface';
import EntitySuggestionOption from '../../components/Entity/EntityLineage/EntitySuggestionOption/EntitySuggestionOption.component';
import Lineage from '../../components/Lineage/Lineage.component';
import { SourceType } from '../../components/SearchedData/SearchedData.interface';
import { PAGE_SIZE_BASE } from '../../constants/constants';
import LineageProvider from '../../context/LineageProvider/LineageProvider';
import {
  OperationPermission,
  ResourceEntity,
} from '../../context/PermissionProvider/PermissionProvider.interface';
import { EntityType } from '../../enums/entity.enum';
import { SearchIndex } from '../../enums/search.enum';
import { EntityReference } from '../../generated/entity/type';
import { useFqn } from '../../hooks/useFqn';
import { getEntityPermissionByFqn } from '../../rest/permissionAPI';
import { searchQuery } from '../../rest/searchAPI';
import { getEntityAPIfromSource } from '../../utils/Assets/AssetsUtils';
import { getLineageEntityExclusionFilter } from '../../utils/EntityLineageUtils';
import { getOperationPermissions } from '../../utils/PermissionsUtils';
import { showErrorToast } from '../../utils/ToastUtils';

const PlatformLineageCustom = () => {
  const history = useHistory();
  const { entityType } = useParams<{ entityType: EntityType }>();
  const { fqn: decodedFqn } = useFqn();
  const [selectedEntity, setSelectedEntity] = useState<SourceType>();
  const [loading, setLoading] = useState(false);
  const [defaultValue, setDefaultValue] = useState<string | undefined>(
    decodedFqn || undefined
  );
  const [permissions, setPermissions] = useState<OperationPermission>();

  const init = useCallback(async () => {
    if (!decodedFqn || !entityType) {
      setDefaultValue(undefined);

      return;
    }

    try {
      setLoading(true);
      const [entityResponse, permissionResponse] = await Promise.allSettled([
        getEntityAPIfromSource(entityType as AssetsUnion)(decodedFqn),
      ]);

      if (entityResponse.status === 'fulfilled') {
        setSelectedEntity(entityResponse.value);
        setDefaultValue(decodedFqn || undefined);
      }

    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setLoading(false);
    }
  }, [decodedFqn, entityType]);

  useEffect(() => {
    init();
  }, [init]);

  const lineageElement = useMemo(() => {
    if (loading) {
      return <Loader />;
    }

    return (
      <LineageProvider>
        <Lineage
          isPlatformLineage
          entity={selectedEntity}
          entityType={entityType}
          hasEditAccess={true}
        />
      </LineageProvider>
    );
  }, [selectedEntity, loading, entityType]);

  return <div className="platform-lineage-container-custom">{lineageElement}</div>;
};

export default PlatformLineageCustom;
