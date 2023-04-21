// ==UserScript==
// @name         SJTU Captcha Image OCR
// @namespace    http://tampermonkey.
// @version      1.0
// @description  A Tampermonkey script to download a web image with id 'captcha-img' on SJTU jaccount login page
// @author       Shanzha
// @match        https://jaccount.sjtu.edu.cn/*
// @require  https://code.jquery.com/jquery-3.6.0.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_info
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';
    const AK = "BdMYpT1Pf4BnOdLaEUFqrI0j"
    const SK = "8pc2kEQ4gtba1FlybZhkoehqLX29MIhD"

    const apiUrl = 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + AK + '&client_secret=' + SK;

    function getImage() {
        return new Promise((resolve) => {
            // Get the captcha image element by its id

            const currentUrl = GM_info.scriptMetaStr.match(/@match\s+(.*)/)[1];

            if (currentUrl.includes("jaccount.sjtu.edu.cn")) {
                // Assign a variable for this website
                let captchaImg = document.getElementById("captcha-img");
                // If the captcha image exists
                if(captchaImg) {
                    // Create a new image element
                    var img = new Image();

                    // Set the source of the image to the URL of the web image
                    img.src = captchaImg.src;

                    // Listen for the image load event
                    img.onload = function () {
                        // Create a canvas element
                        var canvas = document.createElement("canvas");

                        // Set the canvas dimensions to the image dimensions
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // Draw the image on the canvas
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0);

                        // Convert the canvas to a data URL
                        var base64Data = canvas.toDataURL('image/jpeg').split(',')[1];

                        // URL-encode the Base64 data
                        var encodedData = encodeURIComponent(base64Data);
                        resolve(encodedData);

                        // console.log(encodedData)

                    };
                }
            }


        })
    }

    function postApiData() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: apiUrl,
                headers: {
                    'Content-Type': 'application/json'
                },
                onload: function(response) {
                    const responseData = JSON.parse(response.responseText).access_token;
                    resolve(responseData);
                },
                onerror: function(response) {
                    reject(new Error('Error: ' + response.status));
                }
            });
        });
    }

    function postimgData(token, imgurl) {
        const imgApi = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=' + token;

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: imgApi,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                data: 'image=' + imgurl,
                onload: function(response) {
                    const responseData = JSON.parse(response.responseText);
                    resolve(responseData);
                },
                onerror: function(response) {
                    reject(new Error('Error: ' + response.status));
                }
            });
        });
    }


    // Call the postApiData function to send the POST request and get the response data
    postApiData()
        .then(responseData => {
        getImage()
            .then(encodedData => {
            let imgurl = encodedData
            //console.log(imgurl);
            // Use the responseData variable here
            let token = responseData

            // console.log(token);
            postimgData(token, imgurl)
                .then(responseData => {
                // Use the responseData variable here
                let x = responseData

                let text = x.words_result[0].words;
                console.log(text)

                const inputElement = document.getElementById("captcha")

                var new_text = ''

                for (let i = 0;i < text.length; i++) {
                    if (encodeURIComponent(text[i]) != '%20') {
                        new_text = new_text + text[i]
                    }


                }
                console.log(new_text)


                inputElement.value = new_text
            })
        })
    })
        .catch(error => {
        console.error(error);
    });

})();
