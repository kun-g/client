/****************************************************************************
Copyright (c) 2010-2012 cocos2d-x.org

http://www.cocos2d-x.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/
package com.tringame.pocketdungeon;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.UUID;

import org.cocos2dx.lib.Cocos2dxActivity;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Bundle;
import android.telephony.TelephonyManager;

public class PocketDungeon extends Cocos2dxActivity{
	
	protected void onCreate(Bundle savedInstanceState){
		super.onCreate(savedInstanceState);
	}
	
    static {
        System.loadLibrary("cocos2djs");
    }
    
    //--- System Invokes ---
    
    //query bundle version
  	public String getBundleVersion() {
  		PackageInfo info;
		try {
			info = this.getPackageManager().getPackageInfo(getPackageName(), 0);
			return info.versionName;
		} catch (NameNotFoundException e) {}
  		return "0";
  	}
  	
  	//query device id
  	public String getDeviceId(){
  		TelephonyManager tm = (TelephonyManager) this.getSystemService(Context.TELEPHONY_SERVICE);
  		String id = tm.getDeviceId();
  		if( id == null ){
  			try {
				FileInputStream inStream = openFileInput("com-tringame-pocketdungeon-uuid");
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
					FileOutputStream outStream = openFileOutput("com-tringame-pocketdungeon-uuid", Context.MODE_WORLD_READABLE);
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
  	public void alert(String title, String message, String... buttons){
  		AlertDialog.Builder builder = new AlertDialog.Builder(this);
  		builder.setTitle(title);
  		builder.setMessage(message);
  		DialogInterface.OnClickListener listener = new DialogInterface.OnClickListener() {
			@Override
			public void onClick(DialogInterface dialog, int which) {
				// TODO Do something
				
			}
		};
  		for(String s : buttons){
  			builder.setNeutralButton(s, listener);
  		}
  		builder.show();
  	}
  	
  	//open URL
  	public void openURL(String url){
  		Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
  		startActivity(browserIntent);
  	}
  	
  	//check Network Status
  	public int checkNetworkStatus(){
  		ConnectivityManager conmgr = (ConnectivityManager)getSystemService(Context.CONNECTIVITY_SERVICE);
  		NetworkInfo info = conmgr.getActiveNetworkInfo();
  		if( info != null && info.isConnected() ){
  			return 1;
  		}
  		else{
  			return 0;
  		}
  	}
  	
  	//create directory at path
  	public boolean createDirectoryAtPath(String path){
  		File folder = new File(path);
  		if( !folder.exists() ){
  			folder.mkdirs();
  		}
  		return true;
  	}
  	
  	//remove directory
  	public boolean removeDirectory(String path){
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
