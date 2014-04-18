//
//  GameCenter.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-13.
//
//

#include "GameCenter.h"
#import <GameKit/GameKit.h>
#import <UIKit/UIKit.h>
#import "AppController.h"
#import "RootViewController.h"

using namespace std;

UIViewController* gAuthencationView = NULL;

GameCenter* GameCenter::getInstance()
{
    static GameCenter ins;
    return &ins;
}

GameCenter::GameCenter()
{
    mForceLogin = false;
    mpDelegate = NULL;
}

void GameCenter::setDelegate(GameCenterDelegate *delgate)
{
    mpDelegate = delgate;
}

bool GameCenter::isLocalPlayerAuthenticated()
{
    if( [GKLocalPlayer localPlayer].authenticated )
    {
        return true;
    }
    else
    {
        return false;
    }
}

void GameCenter::authenticateLocalPlayer(bool forceLogin)
{
    printf("AuthenticateLocalPlayer\n");
    mForceLogin = forceLogin;
//    [GKLocalPlayer localPlayer].authenticateHandler = ^(UIViewController* viewController, NSError* error)
//    {
//        if( error == nil )
//        {
//            if( this->isLocalPlayerAuthenticated() )
//            {
//                if( this->mpDelegate != NULL )
//                {
//                    this->mpDelegate->localPlayerAuthenticated();
//                }
//            }
//            else
//            {
//                if( this->mForceLogin )
//                {
//                    if( gAuthencationView != NULL )
//                    {
//                        [gAuthencationView release];
//                    }
//                    gAuthencationView = viewController;
//                    [gAuthencationView retain];
//                    dispatch_async(dispatch_get_main_queue(), ^(void){
//                        AppController* delegate = (AppController*)[UIApplication sharedApplication].delegate;
//                        [delegate.viewController presentModalViewController:gAuthencationView animated:YES];
//                        [gAuthencationView release];
//                        gAuthencationView = NULL;
//                    });
//                }
//            }
//        }
//        else
//        {
//            NSLog(@"GameCenter Auth Error: %@", error);
//        }
//    };
    [[GKLocalPlayer localPlayer] authenticateWithCompletionHandler:^(NSError *error) {
        if( error == nil )
        {
            if( this->isLocalPlayerAuthenticated() )
            {
                if( this->mpDelegate != NULL )
                {
                    this->mpDelegate->localPlayerAuthenticated();
                }
            }
        }
        else
        {
            NSLog(@"GameCenter Auth Error: %@", error);
        }
    }];
}

void GameCenter::queryFriendList()
{
    if( this->isLocalPlayerAuthenticated() )
    {
        [[GKLocalPlayer localPlayer] loadFriendsWithCompletionHandler:^(NSArray *friendIDs, NSError *error) {
            if( error == nil )
            {
                if( friendIDs != nil )
                {
                    mFriendList.clear();
                    for(id friendId in friendIDs)
                    {
                        NSString* fid = friendId;
                        mFriendList.push_back(string([fid cStringUsingEncoding:NSUTF8StringEncoding]));
                    }
                    if( this->mpDelegate != NULL )
                    {
                        this->mpDelegate->friendListRetrived();
                    }
                }
            }
            else
            {
                NSLog(@"GameCenter Friend Error: %@", error);
            }
        }];
    }
}

void GameCenter::retriveFriendList(vector<string> &out)
{
    out = mFriendList;
}

void GameCenter::retrivePlayerGCID(string &out)
{
    if( this->isLocalPlayerAuthenticated() )
    {
        out = string([[GKLocalPlayer localPlayer].playerID cStringUsingEncoding:NSUTF8StringEncoding]);
    }
}

void GameCenter::retrivePlayerAlias(string &out)
{
    if( this->isLocalPlayerAuthenticated() )
    {
        out = string([[GKLocalPlayer localPlayer].alias cStringUsingEncoding:NSUTF8StringEncoding]);
    }
}

void GameCenter::retrivePlayerDisplayName(string &out)
{
    if( this->isLocalPlayerAuthenticated() )
    {
        out = string([[GKLocalPlayer localPlayer].displayName cStringUsingEncoding:NSUTF8StringEncoding]);
    }
}