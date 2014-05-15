package com.tringame;
import android.content.pm.*;

public class SystemInvoke {
	
	//query bundle version
	public static String getBundleVersion(){
		
		return info.versionName;
	}
	
	//query device id
	public static String getDeviceId(){
		return "";
	}
	
	//alert
	public static void alert(String title, String message){
		// TODO
	}
	
	//open URL
	public static void openURL(String url){
		
	}
	
	//check Network Status
	public static int checkNetworkStatus(){
		return 0;
	}
	
	//create directory at path
	public static boolean createDirectoryAtPath(String path){
		return true;
	}
	
	//remove directory
	public static boolean removeDirectory(String path){
		return true;
	}
}
