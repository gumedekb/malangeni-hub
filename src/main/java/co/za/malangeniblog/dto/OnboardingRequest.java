package co.za.malangeniblog.dto;

import co.za.malangeniblog.domain.AccountType;

/**
 * The first-sign-in answer: member, or formal/informal business owner. A business answer may
 * carry the badge request details in the same call, so the owner lands straight on the
 * verification list.
 */
public class OnboardingRequest {

    private AccountType accountType;
    private BadgeRequestInput business;

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public BadgeRequestInput getBusiness() {
        return business;
    }

    public void setBusiness(BadgeRequestInput business) {
        this.business = business;
    }
}
