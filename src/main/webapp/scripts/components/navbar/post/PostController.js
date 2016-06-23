/**
 * The purpose of this controller is to collect and maintain data in the status
 * creation window.
 */

tatamiJHipsterApp.controller('PostController', [
    '$scope',
    '$uibModalInstance',
    '$translate',
    'Upload',
    'StatusService',
    'GeolocalisationService',
    'groups', //removing until groups section is finished.
    'curStatus',
    'SearchService',
    '$stateParams',
    '$state',
    'groupId',
    function($scope, $uibModalInstance, $translate, Upload, StatusService, GeolocalisationService, groups, curStatus,
    SearchService, $stateParams, $state, groupId) {

        $scope.$state = $state;
        $scope.isOneDayOrMore = function(date) {
            return moment().diff(moment(date), 'days', true) >= 1;
        };

        $scope.getLanguageKey = function() {
            return $translate.use();
        };

        $scope.determineTitle = function() {
            if(angular.isDefined(curStatus)) {
                return 'post.replyTo'
            }
            else {
                return 'post.update'
            }
        };

        $scope.current = {  // This is the current instance of the status window
            preview: false, // Determines if the status is being previewed by the user
            geoLoc: false,  // Determine if the geolocalization checkbox is checked
            groups: groups, // The groups the user belongs to
            reply: false,   // Determine if this status is a reply to another user
            uploadDone: true,// If the file upload is done, we should not show the progess bar
            uploadProgress: 0,// The progress of the file currently being uploaded
            upload: [],
            contentEmpty: true,
            files: [],
            attachments: []
        };

        $scope.status = {   // This is the current user status information
            content: "",    // The content contained in this status
            groupId: groupId,    // The groupId that this status is being broadcast to
            replyTo: "",     // The user we are replying to
            attachmentIds: [], // An array of all the attachments contained in the status
            geoLocalization: "", // The geographical location of the user when posting the status
            statusPrivate: false // Determines whether the status is private
        };

        $scope.charCount = 750;

        $scope.calculateRemainingLength = function() {
            // Returns maxLength - statusLength - (number of newlines entered in status)
            // This is necessary because newline is input as "\n" (two characters), so characters left counts incorrectly without this
            if ($scope.status.content != null) {
                return $scope.charCount - $scope.status.content.length - ($scope.status.content.match(/\n/g) || []).length;
            }
            else {
                return $scope.charCount;
            }
        }

        $scope.uploadStatus = {
            isUploading: false,
            progress: 0
        };

        /**
         * Watches the current.filestats ng-model and handles uploads

        $scope.$watch('current.files', function() {
            if($scope.current.files !== null) {
                for(var i = 0; i < $scope.current.files.length; ++i) {
                    var file = $scope.current.files[i];
                    $scope.uploadStatus.isUploading = true;
                    $scope.upload = $upload.upload({
                        url: '/tatami/rest/fileupload',
                        file: file,
                        fileFormDataName: 'uploadFile'
                    }).progress(function(evt) {
                        $scope.uploadStatus.progress = parseInt(100.0 * evt.loaded / evt.total);
                    }).success(function(data) {
                        $scope.current.attachments.push(data.data[0]);
                        $scope.uploadStatus.isUploading = false;
                        $scope.uploadStatus.progress = 0;
                        $scope.status.attachmentIds.push(data.data[0].attachmentId);
                    }).error(function() {
                        $scope.uploadStatus.isUploading = false;
                        $scope.uploadStatus.progress = 0;
                    })
                }
            }
        });*/

            // upload on file select or drop
            $scope.upload = function (file) {
                $scope.uploadStatus.isUploading = true;
                Upload.upload({
                    url: '/tatami/rest/fileupload',
                    data: {file: file},
                    fileFormDataName: 'uploadFile'
                }).then(function (data) {
                    $scope.current.attachments.push(data.data[0]);
                    $scope.uploadStatus.isUploading = false;
                    $scope.uploadStatus.progress = 0;
                    $scope.status.attachmentIds.push(data.data[0].attachmentId);
                }, function (resp) {
                    $scope.uploadStatus.isUploading = false;
                    $scope.uploadStatus.progress = 0;
                }, function (evt) {
                    $scope.uploadStatus.progress = parseInt(100.0 * evt.loaded / evt.total);
                });
            };
            // for multiple files:
            $scope.uploadFiles = function (files) {
                if (files && files.length) {
                    for (var i = 0; i < files.length; i++) {
                        $scope.uploadStatus.isUploading = true;
                        Upload.upload({
                            url: '/tatami/rest/fileupload',
                            data: { uploadFile: files[i] },
                        }).then(function (data) {
                            $scope.current.attachments.push(data.data[0]);
                            $scope.uploadStatus.isUploading = false;
                            $scope.uploadStatus.progress = 0;
                            $scope.status.attachmentIds.push(data.data[0].attachmentId);
                        }, function (resp) {
                            $scope.uploadStatus.isUploading = false;
                            $scope.uploadStatus.progress = 0;
                        }, function (evt) {
                            $scope.uploadStatus.progress = parseInt(100.0 * evt.loaded / evt.total);
                        });
                    }
                }
            }

        $scope.fileSize = function(file) {
            if(file.size / 1000 < 1000) {
                return parseInt(file.size / 1000) + "K";

            }
            else{
                return parseInt(file.size / 1000000) + "M";
            }
        };
        /**
         * In order to set reply to a status, we must be able to set current status
         * after an asynchronous get request.
         */
        $uibModalInstance.setCurrentStatus = function(status) {
            var defined = angular.isDefined(status);
            $scope.current.reply = defined;
            $scope.currentStatus = defined ? status : {};
            if(defined) {
                $scope.status.content = '@' + $scope.currentStatus.username + ' ';
                $scope.status.replyTo = status.statusId;
            }
            else {
                $scope.currentStatus.avatarURL = '/assets/images/default_image_profile.png';
            }
        };

        $uibModalInstance.setCurrentStatus(curStatus);

        $scope.closeModal = function() {
            $uibModalInstance.dismiss();
            $scope.reset();
            //$scope.$state.go('^');
        };

        //Handles closing the modal via escape and clicking outside the modal
        //$uibModalInstance.result.finally(function() {
        //    $scope.$state.go('^');
        //});


        /**
         *
         * @param param String argument representing the most up to date status content
         *
         * Simple function to change the current status content
         */
        $scope.statusChange = function(param) {
            $scope.status.content = param;
        };

        $scope.fetchUsers = function(term) {
            return SearchService.query({ 'term': 'users', q: term }, function(result) {
                $scope.users = result;
            })
        };

        $scope.selectUser = function(item) {
            return '@' + item.email;
        };

        $scope.fetchTags = function(term) {
            if(term.length > 0) {
                return SearchService.query({ 'term': 'tags', q: term }, function(result) {
                    $scope.tags = result;
                });
            }

        };

        $scope.selectTag = function(item) {
            return '#' + item.name;
        };


        /**
         * Resets any previously set status data
         */
        $scope.reset = function() {
            $scope.current.preview = false;
            $scope.current.geoLoc = false;
            $scope.current.uploadDone = true;
            $scope.current.uploadProgress = 0;

            $scope.status.content = "";
            $scope.status.groupId = "";
            $scope.status.attachmentIds = [];
            $scope.status.geoLocalization = "";
            $scope.status.replyTo = "";
            $scope.status.statusPrivate = false;
        };


        /**
         * Create a new status based on the current data in the controller.
         * Uses the StatusService for this purpose, and we do nothing if no
         * content has been provided by the user.
         */
        var isAlreadyPosting=false;
        $scope.newStatus = function() {
            if($scope.status.content.trim().length !== 0 && !isAlreadyPosting) {
                isAlreadyPosting=true;
                $scope.status.content = $scope.status.content.trim();
                StatusService.save($scope.status, function() {
                    $uibModalInstance.close();
                    $uibModalInstance.result.then(function() {
                        $scope.$state.transitionTo('timeline', $stateParams, { reload: true });
                    });
                    $scope.reset();
                })
            }
        };

        /** Geolocalization based functions **/

        /**
         * Determine whether the user means to use location data on the current status
         */
        $scope.updateLocation = function() {
            if($scope.current.geoLoc) {
                GeolocalisationService.getGeolocalisation($scope.getLocationString);
            } else {
                $scope.status.geoLocalization = "";
            }
        };

        /**
         * Callback function used in getGeolocalisation. This function sets the status geolocation,
         * and brings up a map.
         */
        $scope.getLocationString = function(position) {
            $scope.status.geoLocalization = position.coords.latitude + ", " + position.coords.longitude;
            $scope.initMap();
        };

        /**
         * Create a map displaying the users current location in the status
         */
        $scope.initMap = function() {
            if ($scope.current.geoLoc) {
                var geoLocalization = $scope.status.geoLocalization;
                var latitude = geoLocalization.split(',')[0].trim();
                var longitude = geoLocalization.split(',')[1].trim();

                var map = new OpenLayers.Map("simpleMap");
                var fromProjection = new OpenLayers.Projection("EPSG:4326");// Transform from WGS 1984
                var toProjection = new OpenLayers.Projection("EPSG:900913");// to Spherical Mercator Projection
                var lonLat = new OpenLayers.LonLat(parseFloat(longitude), parseFloat(latitude)).transform(fromProjection, toProjection);
                var mapnik = new OpenLayers.Layer.OSM();
                var position = lonLat;
                var zoom = 12;

                map.addLayer(mapnik);
                var markers = new OpenLayers.Layer.Markers("Markers");
                map.addLayer(markers);
                markers.addMarker(new OpenLayers.Marker(lonLat));
                map.setCenter(position, zoom);
            }
        }
    }
]);
