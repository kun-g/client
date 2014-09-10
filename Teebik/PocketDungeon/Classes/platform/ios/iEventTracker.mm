//
//  iEventTracker.cpp
//  PocketDungeon-Teebik
//
//  Created by Jovismac on 14-9-10.
//
//

#include "iEventTracker.h"
#import "AppsFlyerTracker.h"

void createGAIEvent(std::string category, std::string action, std::string label, double value){
    NSString* nsCategory = [NSString stringWithFormat:@"%s", category.c_str()];
    NSString* nsAction = [NSString stringWithFormat:@"%s", action.c_str()];
    NSString* nsLabel = [NSString stringWithFormat:@"%s", label.c_str()];
    NSNumber* nsValue = [NSNumber numberWithDouble:value];
    id<GAITracker> tracker = [[GAI sharedInstance] defaultTracker];
    [tracker send:[[GAIDictionaryBuilder createEventWithCategory:nsCategory action:nsAction label:nsLabel value:nsValue] build]];
    
}

void createAFEvent(std::string event, std::string value){
    NSString* nsEvent = [NSString stringWithFormat:@"%s", event.c_str()];
    NSString* nsValue = [NSString stringWithFormat:@"%s", value.c_str()];
    [[AppsFlyerTracker sharedTracker] trackEvent:nsEvent withValue:nsValue];
}