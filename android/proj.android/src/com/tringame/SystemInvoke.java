package com.tringame;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.UUID;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.telephony.TelephonyManager;
import android.util.Log;

public class SystemInvoke {
	
	static {
        System.loadLibrary("cocos2djs");
    }
	
	private static Activity mActivity;
	
	public static void setActivity(Activity act){
		mActivity = act;
	}
	
	//--- System Invokes ---
    public static native void invokeAlertCallback(int button);
    
    //query bundle version
  	public static String getBundleVersion() {
  		PackageInfo info;
		try {
			info = mActivity.getPackageManager().getPackageInfo(mActivity.getPackageName(), 0);
			return info.versionName;
		} catch (NameNotFoundException e) {}
  		return "0";
  	}
  	
  	//query device id
  	public static String getDeviceId(){
  		TelephonyManager tm = (TelephonyManager) mActivity.getSystemService(Context.TELEPHONY_SERVICE);
  		String id = tm.getDeviceId();
  		if( id == null ){
  			try {
				FileInputStream inStream = mActivity.openFileInput("com-tringame-pocketdungeon-uuid");
				try {
					ObjectInputStream oinStream = new ObjectInputStream(inStream);
					id = oinStream.readUTF();
					oinStream.close();
					inStream.close();
				} catch (Exception e) {
					id = "";
				} 
			} catch (FileNotFoundException e) {
				id = UUID.randomUUID().toString();
				try {
					FileOutputStream outStream = mActivity.openFileOutput("com-tringame-pocketdungeon-uuid", Context.MODE_PRIVATE);
					try {
						ObjectOutputStream ooutStream = new ObjectOutputStream(outStream);
						ooutStream.writeUTF(id);
						ooutStream.close();
						outStream.close();
					} catch (IOException e1) {}
					
				} catch (FileNotFoundException e1) {}
			}
  		}
  		return id;
  	}
  	
  	//alert
  	public static void alert(final String title, final String message, final String... buttons){
  		mActivity.runOnUiThread(new Runnable(){
  			public void run()
  			{
  				AlertDialog.Builder builder = new AlertDialog.Builder(mActivity);
  				builder.setTitle(title);
  				builder.setMessage(message);
  		  		DialogInterface.OnClickListener listener = new DialogInterface.OnClickListener() {
  					@Override
  					public void onClick(DialogInterface dialog, int which) {
  						int select = 0;
  						switch(which){
  						case DialogInterface.BUTTON_NEGATIVE: select = 0; break;
  						case DialogInterface.BUTTON_NEUTRAL: select = 1; break;
  						case DialogInterface.BUTTON_POSITIVE: select = 2; break;
  						}
  						invokeAlertCallback(select);
  					}
  				};
  				if( buttons.length > 0 ){
  					builder.setNegativeButton(buttons[0], listener);
  				}
  				if( buttons.length > 1 ){
  					builder.setNeutralButton(buttons[1], listener);
  				}
  				if( buttons.length > 2 ){
  					builder.setPositiveButton(buttons[2], listener);
  				}

  				builder.show();
  			}
  		});
  	}
  	
  	//open URL
  	public static void openURL(String url){
  		Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
  		mActivity.startActivity(browserIntent);
  	}
  	
  	//check Network Status
  	public static int checkNetworkStatus(){
  		ConnectivityManager conmgr = (ConnectivityManager)mActivity.getSystemService(Context.CONNECTIVITY_SERVICE);
  		NetworkInfo info = conmgr.getActiveNetworkInfo();
  		if( info != null && info.isConnected() ){
  			return 1;
  		}
  		else{
  			return 0;
  		}
  	}
  	
  	//create directory at path
  	public static boolean createDirectoryAtPath(String path){
  		File folder = new File(path);
  		if( !folder.exists() ){
  			folder.mkdirs();
  		}
  		return true;
  	}
  	
  	//remove directory
  	public static boolean removeDirectory(String path){
  		File folder = new File(path);
  		if( folder.exists() ){
  			if(folder.isDirectory()){
  				for(String item : folder.list()){
  					new File(path, item).delete();
  				}
  			}
  			folder.delete();
  		}
  		return true;
  	}
}
