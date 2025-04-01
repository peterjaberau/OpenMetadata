
import { Layout } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useLimitStore } from '../../context/LimitsProvider/useLimitsStore';
import { LineageSettings } from '../../generated/configuration/lineageSettings';
import { SettingType } from '../../generated/settings/settings';
import { useApplicationStore } from '../../hooks/useApplicationStore';
import { getLimitConfig } from '../../rest/limitsAPI';
import { getSettingsByType } from '../../rest/settingConfigAPI';
import applicationRoutesClass from '../../utils/ApplicationRoutesClassBase';
import TokenService from '../../utils/Auth/TokenService/TokenServiceUtil';
import {
  extractDetailsFromToken,
  isProtectedRoute,
  isTourRoute,
} from '../../utils/AuthProvider.util';
import { getOidcToken } from '../../utils/LocalStorageUtils';
import { LimitBanner } from '../common/LimitBanner/LimitBanner';
import LeftSidebar from '../MyData/LeftSidebar/LeftSidebar.component';
import NavBar from '../NavBar/NavBar';
import applicationsClassBase from '../Settings/Applications/AppDetails/ApplicationsClassBase';
import { useApplicationsProvider } from '../Settings/Applications/ApplicationsProvider/ApplicationsProvider';
import './app-container.less';

const { Content } = Layout;

const AppContainer = () => {
  const { currentUser, setAppPreferences, appPreferences } =
    useApplicationStore();
  const { applications } = useApplicationsProvider();
  const AuthenticatedRouter = applicationRoutesClass.getRouteElements();
  const ApplicationExtras = applicationsClassBase.getApplicationExtension();
  const { isAuthenticated } = useApplicationStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);

  const { setConfig, bannerDetails } = useLimitStore();

  const fetchAppConfigurations = useCallback(async () => {
    try {
      const [response, lineageConfig] = await Promise.all([
        getLimitConfig(),
        getSettingsByType(SettingType.LineageSettings),
      ]);

      setConfig(response);
      setAppPreferences({
        ...appPreferences,
        lineageConfig: lineageConfig as LineageSettings,
      });
    } catch (error) {
      // silent fail
    }
  }, []);

  const appendReserveRightSidebarClass = useCallback(() => {
    const element = document.getElementsByTagName('body');
    element[0].classList.add('reserve-right-sidebar');
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchAppConfigurations();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (applicationsClassBase.isFloatingButtonPresent(applications)) {
      appendReserveRightSidebarClass();
    }
  }, [applications]);

  useEffect(() => {
    const handleDocumentVisibilityChange = () => {
      if (
        isProtectedRoute(location.pathname) &&
        isTourRoute(location.pathname)
      ) {
        return;
      }
      const { isExpired } = extractDetailsFromToken(getOidcToken());
      if (!document.hidden && isExpired) {
        // force logout
        TokenService.getInstance().refreshToken();
      }
    };

    addEventListener('focus', handleDocumentVisibilityChange);

    return () => {
      removeEventListener('focus', handleDocumentVisibilityChange);
    };
  }, []);

  return (
    <Layout>
      <LimitBanner />
      <Layout
        className={classNames('app-container', {
          ['extra-banner']: Boolean(bannerDetails),
        })}>
        {/* Render left side navigation */}
        <LeftSidebar isSidebarCollapsed={isSidebarCollapsed} />

        {/* Render main content */}
        <Layout>
          {/* Render Appbar */}
          {isProtectedRoute(location.pathname) && isAuthenticated ? (
            <NavBar
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSideBar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          ) : null}

          {/* Render main content */}
          <Content>
            <AuthenticatedRouter />
            {ApplicationExtras && <ApplicationExtras />}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppContainer;
