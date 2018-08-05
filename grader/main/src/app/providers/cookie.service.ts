import {Injectable} from '@angular/core';

declare let mainProcess: any;

const SETTINGS_COOKIE_NAME = 'settings';

@Injectable({
    providedIn: 'root'
})
export class CookieService {

    settings: any = null;

    constructor() {
        this.tryToInitializeFromCookie();
    }

    private tryToInitializeFromCookie() {
        try {
            this.settings = JSON.parse(mainProcess.readCookie(SETTINGS_COOKIE_NAME));
        } catch (e) {
            this.settings = null;
        }
    }

    graderSettingsExists() {
        return this.settings !== null;
    }

    getGraderSettings() {
        if (this.settings === null) {
            this.tryToInitializeFromCookie();
        }
        return this.settings;
    }

    setGraderSettings(graderSettings: any) {
        Object.keys(graderSettings).forEach(function (key) {
            if (!graderSettings[key] || graderSettings[key].toString().length === 0) {
                graderSettings.key = null;
            }
        });
        this.settings = graderSettings;
        mainProcess.writeCookie(SETTINGS_COOKIE_NAME, JSON.stringify(graderSettings));
    }

    deleteGraderSettings() {
        mainProcess.deleteCookie(SETTINGS_COOKIE_NAME);
        this.settings = null;
    }
}

