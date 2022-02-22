package br.com.regex.localapp;

import java.net.URI;
import java.io.File;
import java.net.MalformedURLException;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaInterface;
import org.json.JSONArray;
import org.json.JSONException;

public class LocalApp extends CordovaPlugin {
    private static final String LOG_TAG = "LocalApp";
    private CordovaWebView mainWebView;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        mainWebView = webView;
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("navigateToUrl")) {
            this.navigateToFile(new File(new URI(args.getString(0))));
        } else {
            return false;
        }
        callbackContext.success();
        return true;
    }

    private void navigateToFile(File startPageFile) throws MalformedURLException {
        if (startPageFile != null) {
            String url = startPageFile.toURI().toURL().toString();
            this.navigateToURL(url);
        }
    }

    private void navigateToURL(String url) {
        if (url != null) {
            this.mainWebView.loadUrlIntoView(url, false);
        }
    }

}
