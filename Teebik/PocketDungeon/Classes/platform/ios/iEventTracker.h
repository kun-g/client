//
//  iEventTracker.h
//  PocketDungeon-Teebik
//
//  Created by Jovismac on 14-9-10.
//
//

#ifndef PocketDungeon_Teebik_iEventTracker_h
#define PocketDungeon_Teebik_iEventTracker_h

#include <string>

void createGAIEvent(std::string category, std::string action, std::string label, double value);

void createAFEvent(std::string event, std::string value);

#endif
