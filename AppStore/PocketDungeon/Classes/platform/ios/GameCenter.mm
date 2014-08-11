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

//**** Game Center UI View Controller ****

@interface GameCenterController : NSObject<GKGameCenterControllerDelegate>

@property(assign) UIViewController* viewController;

+(GameCenterController*) sharedGameCenterController;

-(void) showGameCenter;

@end

@implementation GameCenterController

@synthesize viewController;

+(GameCenterController*) sharedGameCenterController
{
    static GameCenterController* ins = nil;
    if( ins == nil ){
        ins = [[GameCenterController alloc] init];
    }
    return ins;
}

-(id) init
{
    if( self = [super init] ){
        viewController = nil;
    }
    return self;
}

-(void) showGameCenter
{
    //lazy init
    if( viewController == nil )
    {
        AppController* app = (AppController*)[UIApplication sharedApplication].delegate;
        viewController = app.viewController;
    }
    
    GKGameCenterViewController *gcc = [[GKGameCenterViewController alloc] init];
    if (gcc != nil)
    {
        gcc.gameCenterDelegate = self;
        [viewController presentViewController: gcc animated: YES
                         completion:nil];
    }
}

-(void) gameCenterViewControllerDidFinish:(GKGameCenterViewController *)gameCenterViewController
{
    [viewController dismissViewControllerAnimated:YES completion:nil];
}

@end

//******************************************

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
    if( mForceLogin ){
        [GKLocalPlayer localPlayer].authenticateHandler = ^(UIViewController* viewController, NSError* error)
        {
            if( error == nil )
            {
                if( this->isLocalPlayerAuthenticated() )
                {
                    if( this->mpDelegate != NULL )
                    {
                        this->mpDelegate->localPlayerAuthenticated();
                    }
                }
                else
                {
                    if( this->mForceLogin )
                    {
                        if( gAuthencationView != NULL )
                        {
                            [gAuthencationView release];
                        }
                        gAuthencationView = viewController;
                        [gAuthencationView retain];
                        dispatch_async(dispatch_get_main_queue(), ^(void){
                            AppController* delegate = (AppController*)[UIApplication sharedApplication].delegate;
                            [delegate.viewController presentModalViewController:gAuthencationView animated:YES];
                            [gAuthencationView release];
                            gAuthencationView = NULL;
                        });
                    }
                }
            }
            else
            {
                NSLog(@"GameCenter Auth Error: %@", error);
            }
        };
    }
    else{
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

void GameCenter::showGameCenterView()
{
    [[GameCenterController sharedGameCenterController] showGameCenter];
}

void GameCenter::reportScore(int64_t score, string identifier){
    NSString *strVersion = [UIDevice currentDevice].systemVersion;
    int intVer = [[strVersion substringWithRange:NSMakeRange(0, 1)] intValue];
    switch (intVer) {
        case 7: //iOS 7
        {
            NSString *nsstrIdentifier = [NSString stringWithCString:identifier.c_str() encoding:[NSString defaultCStringEncoding]];
            GKScore *scoreReporter = [[GKScore alloc] initWithLeaderboardIdentifier:nsstrIdentifier];
            scoreReporter.value = score;
            scoreReporter.context = 0;
            NSArray *scores = @[scoreReporter];
            [GKScore reportScores:scores withCompletionHandler:^(NSError *error){
                NSLog(@"GameCenter: reportScore %@ successfully!\n",nsstrIdentifier);
            }];
        }
            break;
        case 6: //iOS 6
        {
            NSString *nsstrIdentifier = [NSString stringWithCString:identifier.c_str() encoding:[NSString defaultCStringEncoding]];
            GKScore *scoreReporter = [[GKScore alloc] initWithLeaderboardIdentifier:nsstrIdentifier];
            scoreReporter.value = score;
            scoreReporter.context = 0;
            [scoreReporter reportScoreWithCompletionHandler:^(NSError *error){
                NSLog(@"GameCenter: reportScore %@ successfully!\n",nsstrIdentifier);
            }];
        }
            break;
        default: //earlier than 6
            NSLog(@"GameCenter: cannot report score, the iOS version is earlier than 7.0");
            break;
    }
}
