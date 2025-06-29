import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Settings as SettingsIcon, Palette, Monitor } from 'lucide-react';

const Settings: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Paramètres</h1>
        <SettingsIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />
      </div>

      {/* Appearance Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Palette className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Apparence</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Personnalisez l'apparence de votre interface
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-teal-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    Mode {isDarkMode ? 'Sombre' : 'Clair'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {isDarkMode 
                      ? 'Interface sombre pour réduire la fatigue oculaire' 
                      : 'Interface claire et lumineuse'
                    }
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                  isDarkMode ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Theme Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  !isDarkMode 
                    ? 'border-teal-500 bg-white' 
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
                onClick={() => !isDarkMode || toggleTheme()}
              >
                <div className="flex items-center justify-between mb-3">
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">Mode Clair</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-2 bg-teal-200 rounded w-1/2"></div>
                </div>
              </div>

              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isDarkMode 
                    ? 'border-teal-500 bg-gray-800' 
                    : 'border-gray-300 bg-gray-100 hover:border-gray-400'
                }`}
                onClick={() => isDarkMode || toggleTheme()}
              >
                <div className="flex items-center justify-between mb-3">
                  <Moon className="w-5 h-5 text-blue-400" />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                    Mode Sombre
                  </span>
                </div>
                <div className="space-y-2">
                  <div className={`h-2 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                  <div className={`h-2 rounded w-3/4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-500'}`}></div>
                  <div className={`h-2 rounded w-1/2 ${isDarkMode ? 'bg-teal-600' : 'bg-teal-400'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Monitor className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Informations Système</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Application</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Nom:</span>
                  <span className="font-medium">Hiya - Gestion de Boutique</span>
                </div>
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Développé par:</span>
                  <span className="font-medium">Zender Akram</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Fonctionnalités</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Gestion des ventes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Gestion des locations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Gestion des stocks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Impression de reçus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/zender-logo.jpg" 
              alt="Zender Akram" 
              className="w-16 h-16 rounded-full object-cover border-2 border-teal-200 dark:border-teal-700"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Développeur Zender Akram
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            développé par : Zender Akram
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Solution complète de gestion pour boutiques de vêtements et location d'articles de mode.
            Développé avec expertise pour simplifier votre gestion quotidienne.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;