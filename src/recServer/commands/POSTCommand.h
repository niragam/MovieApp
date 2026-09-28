#ifndef POSTCOMMAND_H
#define POSTCOMMAND_H

#include "ICommand.h"
#include "../MovieManager.h"

class POSTCommand : public ICommand
{
private:
    MovieManager &manager;

public:
    POSTCommand(MovieManager &manager);
    void execute(std::istringstream &input, std::ostream &output) override;
    bool mutates() const override { return true; }
};

#endif