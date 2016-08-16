﻿/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>

module BMA.OneDrive {
    export class OneDriveUserProfile {
        id: string;
        first_name: string;
        last_name: string;
        imageUri: string;
    }

    export interface OneDriveFile extends BMA.UIDrivers.ModelInfo {
        id: string;
        "@content.downloadUrl": string;
    }

    export class LoginFailure {
        public error: any;
        public error_description: any;
    }

    export interface IOneDrive {
        GetUserProfile(): JQueryPromise<OneDriveUserProfile>;

        /// Creates a root folder.
        /// Returns its ID.
        CreateFolder(name: string): JQueryPromise<string>;

        // Finds a root folder with given name.
        // Returns its ID or null, if the folder is not found.
        FindFolder(name: string): JQueryPromise<string>;
        
        EnumerateFiles(folderId: string): JQueryPromise<OneDriveFile[]>;

        /// Creates or replaces a file in the given folder. 
        /// Returns the saved file information.
        SaveFile(folderId: string, name: string, content: JSON): JQueryPromise<OneDriveFile>;

        LoadFile(file: OneDriveFile): JQueryPromise<JSON>;
    }

    export interface IOneDriveConnector {
        Enable(onLogin: (oneDrive: IOneDrive) => void, onLoginFailed: (error: LoginFailure) => void, onLogout: (any) => void): void;
    }

    //************************************************************************************************
    // 
    // Models and repository
    //
    //************************************************************************************************
    export class OneDriveRepository {
        private static bmaFolder = "BioModelAnalyzer";
        private oneDrive: IOneDrive;
        private folderId: string;

        constructor(oneDrive: IOneDrive) {
            this.oneDrive = oneDrive;
            this.folderId = null;
        }

        private EnumerateModels(folderId: string): JQueryPromise<OneDriveFile[]> {
            return this.oneDrive.EnumerateFiles(folderId);
        }

        /// If folder is missing and createIfNotFound is false, returns null.
        private UseBmaFolder(createIfNotFound: boolean): JQueryPromise<string> {
            var d = $.Deferred();
            if (this.folderId) {
                d.resolve(this.folderId);
            } else {
                var that = this;
                this.oneDrive.FindFolder(OneDriveRepository.bmaFolder)
                    .done(function (folderId: string) {
                        if (folderId) {
                            that.folderId = folderId;
                            d.resolve(folderId);
                        } else {
                            console.log("BMA folder not found");
                            if (createIfNotFound) {
                                that.oneDrive.CreateFolder(OneDriveRepository.bmaFolder)
                                    .done(function (folderId) {
                                        that.folderId = folderId;
                                        d.resolve(folderId);
                                    })
                                    .fail(function (err) {
                                        console.error("Failed to create a folder for BMA on the OneDrive: " + err);
                                        d.reject(err);
                                    });
                            }
                            else d.resolve(null); // folder not found
                        }
                    })
                    .fail(function (err) {
                        d.reject(err); // failed when tried to find the bma folder
                    });
            }
            return d.promise();
        }

        public GetUserProfile(): JQueryPromise<OneDriveUserProfile> {
            return this.oneDrive.GetUserProfile();
        }        

        /* IModelRepository implementation */

        public GetModelList(): JQueryPromise<string[]> {
            var that = this;
            return this.UseBmaFolder(false)
                .then(function (folderId) {
                    if (folderId) {
                        return that.EnumerateModels(folderId);
                    } else { // no bma folder
                        return new Array<string>(0);
                    }
               });
        }

        public LoadModel(file: OneDriveFile): JQueryPromise<JSON> {
            var that = this;
            return this.UseBmaFolder(false)
                .then<JSON>(function (folderId: string) {
                    return that.oneDrive.LoadFile(file);
                });
        }

        /// Saves moodel to the BMA folder using `modelName` as file name.
        /// Creates the BMA folder, unless it exists.
        /// Returns id of the saved file.
        public SaveModel(modelName: string, modelContent: JSON): JQueryPromise<string> {
            var that = this;
            return this.UseBmaFolder(true)
                .then<string>(function (folderId: string) {
                    return that.oneDrive.SaveFile(folderId, modelName, modelContent);
                });
        }
    }
}