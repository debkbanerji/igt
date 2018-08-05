import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {CookieService} from "../providers/cookie.service";

const DEFAULT_SETTINGS = {
    graderName: null,
    intellijScript: null,
    pycharmScript: null,
    javaCommand: 'java',
    javaCompilerCommand: 'javac',
    python3Command: 'python',
    enableParticles: true,
    isDarkTheme: false
};

declare let particlesJS: any;
declare let mainProcess: any;

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

    public settings: any;
    public mustInitialize: boolean;

    constructor(
        private router: Router,
        private cookieService: CookieService
    ) {
    }

    ngOnInit() {
        if (this.cookieService.graderSettingsExists()) {
            this.settings = this.cookieService.getGraderSettings();
            this.mustInitialize = false;
        } else {
            this.settings = DEFAULT_SETTINGS;
            this.mustInitialize = true;
        }
        if (this.settings.enableParticles) {
            particlesJS.load('particles-js-target', 'assets/json/particlesjs-config.json', function () {
            });
        }
    }


    exitWithoutSaving() {
        this.router.navigate(['']);
    }

    saveSettings() {
        const component = this;
        this.cookieService.setGraderSettings(this.settings);
        component.router.navigate(['']);
    }

    resetSettings() {
        this.settings = DEFAULT_SETTINGS;
        this.mustInitialize = true;
        this.cookieService.deleteGraderSettings();
    }


    public openDevTools() {
        mainProcess.openDevTools();
    }
}
