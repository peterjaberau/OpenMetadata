
import { isEmpty } from 'lodash';
import React, { FC, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { Router } from 'react-router-dom';
import AppRouter from './components/AppRouter/AppRouter';
import { AuthProvider } from './components/Auth/AuthProviders/AuthProvider';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import { EntityExportModalProvider } from './components/Entity/EntityExportModalProvider/EntityExportModalProvider.component';
import ApplicationsProvider from './components/Settings/Applications/ApplicationsProvider/ApplicationsProvider';
import WebAnalyticsProvider from './components/WebAnalytics/WebAnalyticsProvider';
import AntDConfigProvider from './context/AntDConfigProvider/AntDConfigProvider';
import AsyncDeleteProvider from './context/AsyncDeleteProvider/AsyncDeleteProvider';
import PermissionProvider from './context/PermissionProvider/PermissionProvider';
import TourProvider from './context/TourProvider/TourProvider';
import WebSocketProvider from './context/WebSocketProvider/WebSocketProvider';
import { useApplicationStore } from './hooks/useApplicationStore';
import { getCustomUiThemePreference } from './rest/settingConfigAPI';
import { history } from './utils/HistoryUtils';
import i18n from './utils/i18next/LocalUtil';
import { getThemeConfig } from './utils/ThemeUtils';

const App: FC = () => {
  const { applicationConfig, setApplicationConfig } = useApplicationStore();

  const fetchApplicationConfig = async () => {
    try {
      const data = await getCustomUiThemePreference();

      setApplicationConfig({
        ...data,
        customTheme: getThemeConfig(data.customTheme),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  useEffect(() => {
    fetchApplicationConfig();
  }, []);

  useEffect(() => {
    const faviconHref = isEmpty(
      applicationConfig?.customLogoConfig?.customFaviconUrlPath
    )
      ? '/favicon.png'
      : applicationConfig?.customLogoConfig?.customFaviconUrlPath ??
        '/favicon.png';
    const link = document.querySelectorAll('link[rel~="icon"]');

    if (!isEmpty(link)) {
      link.forEach((item) => {
        item.setAttribute('href', faviconHref);
      });
    }
  }, [applicationConfig]);

  return (
    <div className="main-container">
      <div className="content-wrapper" data-testid="content-wrapper">
        <Router history={history}>
          <I18nextProvider i18n={i18n}>
            <HelmetProvider>
              <ErrorBoundary>
                <AntDConfigProvider>
                  <AuthProvider childComponentType={AppRouter}>
                    <TourProvider>
                      <WebAnalyticsProvider>
                        <PermissionProvider>
                          <WebSocketProvider>
                            <ApplicationsProvider>
                              <AsyncDeleteProvider>
                                <EntityExportModalProvider>
                                  <AppRouter />
                                </EntityExportModalProvider>
                              </AsyncDeleteProvider>
                            </ApplicationsProvider>
                          </WebSocketProvider>
                        </PermissionProvider>
                      </WebAnalyticsProvider>
                    </TourProvider>
                  </AuthProvider>
                </AntDConfigProvider>
              </ErrorBoundary>
            </HelmetProvider>
          </I18nextProvider>
        </Router>
      </div>
    </div>
  );
};

export default App;
